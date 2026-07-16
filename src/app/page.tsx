"use client";

import React, { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Search, Star, Radio } from 'lucide-react';
import { siteConfig, Channel, Match } from '../config';
import BottomNav from '../components/BottomNav';
import AnalyticsTracker from '../components/AnalyticsTracker';
import SafeImage from '../components/SafeImage';
import ChannelsTab from '../components/ChannelsTab';
import MatchSchedule from '../components/MatchSchedule';
import SearchTab from '../components/SearchTab';

const CustomPlayer = dynamic(() => import('../components/CustomPlayer'), { ssr: false });

interface IPTVChannel {
  id?: string;
  name: string;
  logo: string;
  category: string;
  urls: string[];
  country?: string;
  isGeoBlocked?: boolean;
  status?: string;
  failure_count?: number;
}

const getCountryIcon = (countryName: string) => {
  switch (countryName) {
    case 'Bangladesh': return '🇧🇩';
    case 'India': return '🇮🇳';
    case 'United Kingdom': return '🇬🇧';
    case 'United States': return '🇺🇸';
    case 'Pakistan': return '🇵🇰';
    case 'Global Sports': return '⚽';
    case 'Albania': return '🇦🇱';
    case 'Argentina': return '🇦🇷';
    case 'Chile': return '🇨🇱';
    case 'China': return '🇨🇳';
    case 'Azerbaijan': return '🇦🇿';
    case 'Croatia': return '🇭🇷';
    case 'Italy': return '🇮🇹';
    case 'Turkey': return '🇹🇷';
    default: return '🌐';
  }
};

const getCategoryDisplayName = (catName: string) => {
  switch (catName) {
    case 'All': return '📺 All';
    case 'Favorites': return '⭐ Bookmarks';
    case 'Sports': return '⚽ Sports';
    case 'News': return '📰 News';
    case 'Movies': return '🍿 Movies';
    case 'Kids': return '👶 Kids';
    case 'Entertainment': return '🎭 Entertainment';
    default: return catName;
  }
};

export default function Home() {
  const [activeTab, setActiveTab] = useState<'home' | 'channels' | 'upcoming' | 'search'>('home');
  const [channels, setChannels] = useState<IPTVChannel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<IPTVChannel | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Sync tab status query parameter on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initialTab = params.get('tab');
    if (initialTab && ['home', 'channels', 'upcoming', 'search'].includes(initialTab)) {
      setActiveTab(initialTab as any);
    }

    const handleTabChangeEvent = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail && ['home', 'channels', 'upcoming', 'search'].includes(detail)) {
        setActiveTab(detail);
      }
    };
    window.addEventListener('tab-change', handleTabChangeEvent);
    return () => {
      window.removeEventListener('tab-change', handleTabChangeEvent);
    };
  }, []);

  const handleTabChange = (tab: 'home' | 'channels' | 'upcoming' | 'search') => {
    setActiveTab(tab);
    window.dispatchEvent(new CustomEvent('tab-change', { detail: tab }));
    // Update URL parameter
    const newUrl = tab === 'home' ? '/' : `/?tab=${tab}`;
    window.history.pushState({}, '', newUrl);
  };

  useEffect(() => {
    let externalChannels: IPTVChannel[] = [];
    let unsubscribe: (() => void) | null = null;

    async function initPlatform() {
      try {
        const res = await fetch('/api/channels');
        if (!res.ok) {
          throw new Error(`Failed to load channels: Server returned ${res.status} ${res.statusText}`);
        }
        const data = await res.json();
        
        if (data && data.error) {
          throw new Error(data.error);
        }
        
        if (!Array.isArray(data)) {
          throw new Error("Invalid channel data format received from API.");
        }

        // Separate custom channels (which have id) from external channels
        externalChannels = data.filter((c: IPTVChannel) => !c.id);
        setChannels(data);

        // Load favorites from local client storage
        const savedFavs = JSON.parse(localStorage.getItem('tv_favs') || '[]');
        setFavorites(savedFavs);

        // Load last watched station name
        const lastTrack = localStorage.getItem('last_channel_name');
        const defaultChannel = data.find((c: IPTVChannel) => c.name === lastTrack) || data[0];
        if (defaultChannel) {
          setSelectedChannel(defaultChannel);
        }

        // Set up real-time listener for custom channels from Firestore
        const { db } = await import('@/lib/firebase');
        const { collection, onSnapshot } = await import('firebase/firestore');

        unsubscribe = onSnapshot(collection(db, 'channels'), (snapshot) => {
          const updatedCustomChannels: IPTVChannel[] = [];
          snapshot.forEach((doc) => {
            const val = doc.data();
            updatedCustomChannels.push({
              id: doc.id,
              name: val.name || '',
              logo: val.logo || '',
              category: val.category || 'General',
              urls: val.urls || (val.url ? [val.url] : []),
              country: val.country || 'Bangladesh',
              status: val.status || 'Smooth',
              failure_count: val.failureCount ?? val.failure_count ?? 0,
              isGeoBlocked: !!val.isGeoBlocked
            });
          });

          // Re-merge external channels with updated custom channels
          const customNames = new Set(updatedCustomChannels.map(c => c.name.toLowerCase()));
          const filteredExternal = externalChannels.filter(c => !customNames.has(c.name.toLowerCase()));
          
          const merged = [...updatedCustomChannels, ...filteredExternal];
          setChannels(merged);

          // Update currently selected channel if it was updated
          setSelectedChannel((prev) => {
            if (!prev) return null;
            const updatedMatch = updatedCustomChannels.find(c => c.name.toLowerCase() === prev.name.toLowerCase());
            if (updatedMatch) {
              return updatedMatch;
            }
            return prev;
          });
        });
      } catch (err: any) {
        console.error("Platform Init Error:", err);
        setError(err.message || "Failed to initialize live TV streams.");
      } finally {
        setLoading(false);
      }
    }
    initPlatform();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  // Map IPTVChannel[] to Channel[] for compatibility with sub-components
  const mappedChannels = useMemo<Channel[]>(() => {
    return channels.map((c, index) => ({
      id: c.name, // matching the name-based favorites logic
      name: c.name,
      logoUrl: c.logo || 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=150&auto=format&fit=crop',
      category: c.category || 'General',
      isLive: true,
      metadata: `${c.category} • HD`,
      country: c.country || 'Global Sports',
      sources: c.urls.map((url, uIndex) => ({
        id: `src-ch-${index}-${uIndex}`,
        name: `Mirror ${uIndex + 1}`,
        url: url,
        status: 'Stable' as const
      }))
    }));
  }, [channels]);

  const handleSelectMappedChannel = (mChannel: Channel) => {
    const original = channels.find(c => c.name === mChannel.name);
    if (original) {
      handleChannelSelect(original);
      setActiveTab('home');
    }
  };

  const handleToggleFavoriteMapped = (id: string) => {
    setFavorites(prev => {
      const updated = prev.includes(id)
        ? prev.filter(item => item !== id)
        : [...prev, id];
      localStorage.setItem('tv_favs', JSON.stringify(updated));
      return updated;
    });
  };

  const handleWatchMatch = (match: Match) => {
    const urls = match.sources.map(s => s.url);
    setSelectedChannel({
      name: `${match.homeTeam.name} vs ${match.awayTeam.name}`,
      logo: `https://flagcdn.com/w80/${match.homeTeam.flagCode}.png`,
      category: match.tournament,
      urls: urls
    });
    setActiveTab('home');
  };

  const handleChannelSelect = (channel: IPTVChannel) => {
    setSelectedChannel(channel);
    localStorage.setItem('last_channel_name', channel.name);
    // Smooth scroll to top on mobile for video player visibility
    if (window.innerWidth < 1024) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const toggleFavorite = (name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites(prev => {
      const updated = prev.includes(name)
        ? prev.filter(item => item !== name)
        : [...prev, name];
      localStorage.setItem('tv_favs', JSON.stringify(updated));
      return updated;
    });
  };

  // Categories parsing memo calculation
  const categories = useMemo(() => {
    const list = channels.map(c => c.category);
    return ['All', 'Favorites', ...Array.from(new Set(list))];
  }, [channels]);

  // Countries parsing memo calculation
  const countries = useMemo(() => {
    const list = channels.map(c => c.country || 'Global Sports');
    const unique = Array.from(new Set(list));
    const order = ['Bangladesh', 'India', 'United Kingdom', 'United States', 'Pakistan', 'Global Sports'];
    return [
      'All',
      ...unique.sort((a, b) => {
        const indexA = order.indexOf(a);
        const indexB = order.indexOf(b);
        if (indexA !== -1 && indexB !== -1) return indexA - indexB;
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;
        return a.localeCompare(b);
      })
    ];
  }, [channels]);

  // Client filtering & dynamic sorting (Favorites float to top)
  const processedChannels = useMemo(() => {
    let result = channels.filter(c => 
      c.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Country filter
    if (selectedCountry !== 'All') {
      result = result.filter(c => (c.country || 'Global Sports') === selectedCountry);
    }

    // Category filter
    if (selectedCategory === 'Favorites') {
      result = result.filter(c => favorites.includes(c.name));
    } else if (selectedCategory !== 'All') {
      result = result.filter(c => c.category === selectedCategory);
    }

    // Sort: favorites first, then alphabetically by name
    return [...result].sort((a, b) => {
      const aFav = favorites.includes(a.name) ? 1 : 0;
      const bFav = favorites.includes(b.name) ? 1 : 0;
      if (bFav !== aFav) {
        return bFav - aFav;
      }
      return a.name.localeCompare(b.name);
    });
  }, [channels, searchQuery, selectedCategory, selectedCountry, favorites]);

  // Loading Screen Skeleton Loader
  if (loading) {
    return (
      <div className="w-full min-h-screen bg-[#090b10] text-[#f8fafc] pb-24 md:pb-12 md:pt-6">
        <div className="w-full max-w-6xl mx-auto px-4 mt-20 md:mt-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column: Player Screen Area Skeleton */}
            <div className="lg:col-span-8 space-y-4 w-full">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 w-1/3 h-6 rounded-lg bg-white/5 shimmer" />
                <div className="w-24 h-8 rounded-xl bg-white/5 shimmer" />
              </div>

              {/* Video Player Skeleton */}
              <div className="w-full aspect-video bg-[#141821]/40 border border-white/5 rounded-3xl overflow-hidden shadow-2xl relative flex flex-col justify-between p-6">
                <div className="w-full h-full flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-white/5 shimmer flex items-center justify-center">
                    <div className="w-6 h-6 rounded-full bg-white/10" />
                  </div>
                </div>
                <div className="flex justify-between items-center mt-auto w-full">
                  <div className="flex items-center gap-4 w-1/2">
                    <div className="w-8 h-8 rounded-lg bg-white/5 shimmer" />
                    <div className="w-20 h-4 rounded-lg bg-white/5 shimmer" />
                  </div>
                  <div className="w-16 h-8 rounded-lg bg-white/5 shimmer" />
                </div>
              </div>

              {/* Server info bar skeleton */}
              <div className="w-full h-10 rounded-2xl bg-white/5 shimmer border border-white/5" />
            </div>

            {/* Right Column: Dynamic Controller Station Skeleton */}
            <div className="lg:col-span-4 bg-[#141821] border border-white/5 rounded-3xl p-4 flex flex-col h-[75vh] md:h-[80vh] space-y-4">
              {/* Search input skeleton */}
              <div className="w-full h-11 bg-white/5 shimmer rounded-xl border border-white/5" />

              {/* Categories scroll area skeleton */}
              <div className="flex gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="w-20 h-8 rounded-full bg-white/5 shimmer shrink-0" />
                ))}
              </div>

              {/* Channel List Skeletons */}
              <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 no-scrollbar">
                {Array.from({ length: 6 }).map((_, idx) => (
                  <div
                    key={`loading-ch-${idx}`}
                    className="w-full flex items-center justify-between p-2.5 rounded-2xl border border-white/5 bg-[#090b10]/20"
                  >
                    <div className="flex items-center gap-3 min-w-0 w-3/4">
                      {/* Logo placeholder */}
                      <div className="w-10 h-10 rounded-xl bg-white/5 shimmer flex-shrink-0" />
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <div className="h-3 w-2/3 bg-white/5 shimmer rounded-full" />
                        <div className="h-2 w-1/3 bg-white/5 shimmer rounded-full" />
                      </div>
                    </div>
                    {/* Star placeholder */}
                    <div className="w-6 h-6 rounded-lg bg-white/5 shimmer mr-2" />
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full min-h-screen bg-[#090b10] text-[#f8fafc] flex flex-col items-center justify-center p-4">
        <div className="glass-panel p-8 rounded-3xl border border-rose-500/20 max-w-md w-full text-center shadow-2xl bg-[#141821]/60 backdrop-blur-md">
          <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500 mx-auto mb-4 font-bold text-xl">
            !
          </div>
          <h2 className="text-lg font-black text-white uppercase tracking-wider mb-2">Failed to Load Channels</h2>
          <p className="text-slate-400 text-xs mb-6 leading-relaxed">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 rounded-xl bg-[#00b4d8] hover:bg-[#00b4d8]/80 text-[#090b10] text-xs font-black uppercase tracking-wider transition-all shadow-md active:scale-95 cursor-pointer"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-[#090b10] text-[#f8fafc] pb-24 md:pb-12 md:pt-6">
      <AnalyticsTracker activeChannelName={selectedChannel?.name} />
      
      {/* Navigation Headers and Footers */}
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Grid Layout wrapper */}
      <div className="w-full max-w-6xl mx-auto px-4 mt-20 md:mt-24">
        {activeTab === 'home' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column: Player Screen Area */}
            <div className="lg:col-span-8 lg:sticky lg:top-24 space-y-4 w-full">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 truncate">
                  <Radio className="w-4 h-4 text-rose-500 animate-pulse flex-shrink-0" />
                  <h1 className="text-lg md:text-xl font-black text-white tracking-wide truncate">
                    Now Airing: {selectedChannel ? selectedChannel.name : 'Select Stream'}
                  </h1>
                </div>
                {selectedChannel && (
                  <button 
                    onClick={(e) => toggleFavorite(selectedChannel.name, e)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all duration-300 flex items-center gap-1.5 ${
                      favorites.includes(selectedChannel.name) 
                        ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30' 
                        : 'bg-white/5 text-slate-400 border-white/5 hover:border-white/10'
                    }`}
                  >
                    <Star className={`w-3.5 h-3.5 ${favorites.includes(selectedChannel.name) ? 'fill-yellow-400 text-yellow-400' : 'text-slate-400'}`} />
                    <span>{favorites.includes(selectedChannel.name) ? 'Bookmarked' : 'Favorite'}</span>
                  </button>
                )}
              </div>

              <CustomPlayer 
                urls={selectedChannel ? selectedChannel.urls : []} 
                channelName={selectedChannel?.name}
                isGeoBlocked={selectedChannel?.isGeoBlocked}
                country={selectedChannel?.country}
                channelId={selectedChannel?.id}
              />
              {selectedChannel && (
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold uppercase tracking-wider bg-white/5 border border-white/5 rounded-2xl px-4 py-2.5">
                  <span>Available Server Mirrors: {selectedChannel.urls.length}</span>
                  <span className="text-[#00b4d8]">{selectedChannel.category}</span>
                </div>
              )}
            </div>

            {/* Right Column: Dynamic Controller Station */}
            <div className="lg:col-span-4 bg-[#141821] border border-white/5 rounded-3xl p-4 flex flex-col h-[75vh] md:h-[80vh] shadow-[0_15px_40px_rgba(0,0,0,0.55)]">
              <div className="space-y-3 mb-4 flex-shrink-0">
                
                {/* Search bar */}
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input 
                    type="text"
                    placeholder="Search stream networks..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#090b10] border border-white/5 hover:border-white/10 text-white placeholder-slate-500 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-[#00b4d8] transition-all font-medium"
                  />
                </div>

                {/* Country Filter Selection */}
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block ml-1">Country</span>
                  <div className="flex gap-1.5 overflow-x-auto pb-1 text-[11px] no-scrollbar snap-x">
                    {countries.map((country, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedCountry(country)}
                        className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all border snap-start flex items-center gap-1 ${
                          selectedCountry === country
                            ? 'bg-[#00b4d8]/15 text-[#00b4d8] border-[#00b4d8] shadow-inner shadow-[#00b4d8]/10'
                            : 'bg-[#090b10] text-slate-400 border-white/5 hover:bg-[#090b10]/80'
                        }`}
                      >
                        <span>{country === 'All' ? '🌐' : getCountryIcon(country)}</span>
                        <span>{country === 'All' ? 'All Countries' : country}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Category Filter Selection */}
                <div className="space-y-1 border-t border-white/5 pt-2">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block ml-1">Category</span>
                  <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar snap-x">
                    {categories.map((cat, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-3.5 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all border snap-start ${
                          selectedCategory === cat 
                            ? 'bg-[#00b4d8]/15 text-[#00b4d8] border-[#00b4d8] shadow-inner shadow-[#00b4d8]/10' 
                            : 'bg-[#090b10] text-slate-400 border-white/5 hover:bg-[#090b10]/80'
                        }`}
                      >
                        {getCategoryDisplayName(cat)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Scrollable Channels Cards Stack */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 no-scrollbar">
                {selectedCategory === 'Favorites' && favorites.length === 0 ? (
                  <div className="text-center py-10 px-4 border border-dashed border-white/10 rounded-2xl bg-[#090b10]/20 flex flex-col items-center">
                    <Star className="w-8 h-8 text-yellow-500/40 mb-2 fill-none animate-pulse" />
                    <p className="text-xs text-slate-300 font-bold mb-1">
                      No Bookmarked Channels
                    </p>
                    <p className="text-[10px] text-slate-500 leading-normal max-w-[180px] mb-4 text-center">
                      Click the star icon on any channel to bookmark your favorites here.
                    </p>
                    <button
                      onClick={() => setSelectedCategory('All')}
                      className="px-3.5 py-1.5 rounded-xl bg-[#00b4d8]/10 text-[#00b4d8] border border-[#00b4d8]/20 text-[10px] font-extrabold uppercase hover:bg-[#00b4d8]/20 transition-all cursor-pointer"
                    >
                      Browse All
                    </button>
                  </div>
                ) : processedChannels.length > 0 ? (
                  processedChannels.map((channel, idx) => {
                    const isFav = favorites.includes(channel.name);
                    const isPlaying = selectedChannel?.name === channel.name;
                    return (
                      <div
                        key={idx}
                        onClick={() => handleChannelSelect(channel)}
                        className={`w-full flex items-center justify-between p-2.5 rounded-2xl cursor-pointer transition-all border ${
                          isPlaying 
                            ? 'bg-[#00b4d8]/10 text-white border-[#00b4d8]/40 shadow-inner' 
                            : 'bg-[#090b10]/40 hover:bg-white/5 border-white/5 hover:border-white/10'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl p-1 bg-white flex-shrink-0 relative overflow-hidden">
                            <SafeImage 
                              src={channel.logo} 
                              alt={channel.name} 
                              fill
                              sizes="40px"
                              className="object-contain p-1"
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs md:text-sm font-bold truncate tracking-wide text-slate-200">
                              {channel.name}
                            </p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className={`text-[9px] font-semibold ${isPlaying ? 'text-[#00b4d8] opacity-90' : 'text-slate-500'} uppercase tracking-wider`}>
                                {channel.category}
                              </span>
                              <span className="text-[9px] text-slate-700 font-black">•</span>
                              <span className="text-[9px] font-bold text-slate-400 flex items-center gap-0.5">
                                <span>{getCountryIcon(channel.country || 'Global Sports')}</span>
                                <span>{channel.country || 'Global Sports'}</span>
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <button 
                          onClick={(e) => toggleFavorite(channel.name, e)}
                          className="p-2 text-slate-400 hover:text-yellow-400 hover:scale-110 transition-all cursor-pointer"
                          title={isFav ? "Remove from Favorites" : "Add to Favorites"}
                        >
                          <Star className={`w-4.5 h-4.5 ${isFav ? 'fill-yellow-400 text-yellow-400' : 'text-slate-600'}`} />
                        </button>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-center text-xs text-slate-500 pt-8 font-semibold uppercase tracking-wider">
                    No live networks match filters.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'channels' && (
          <ChannelsTab 
            channels={mappedChannels} 
            onSelectChannel={handleSelectMappedChannel}
            activeChannelId={selectedChannel?.name}
            favorites={favorites}
            onToggleFavorite={handleToggleFavoriteMapped}
          />
        )}

        {activeTab === 'upcoming' && (
          <MatchSchedule 
            schedules={siteConfig.schedules}
            onWatchMatch={handleWatchMatch}
            activeMatchId={selectedChannel?.name ? siteConfig.schedules.find(m => `${m.homeTeam.name} vs ${m.awayTeam.name}` === selectedChannel.name)?.id : undefined}
          />
        )}

        {activeTab === 'search' && (
          <SearchTab 
            channels={mappedChannels}
            onSelectChannel={handleSelectMappedChannel}
            activeChannelId={selectedChannel?.name}
            favorites={favorites}
            onToggleFavorite={handleToggleFavoriteMapped}
          />
        )}
      </div>
    </div>
  );
}
