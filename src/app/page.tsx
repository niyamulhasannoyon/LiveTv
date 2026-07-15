"use client";

import React, { useState, useEffect } from 'react';
import { PlayCircle, Search, Info, ChevronRight, Menu, MoreVertical } from 'lucide-react';
import { siteConfig, Match, Channel } from '../config';
import BottomNav from '../components/BottomNav';
import TrendingChannels from '../components/TrendingChannels';
import MatchSchedule from '../components/MatchSchedule';
import ChannelsTab from '../components/ChannelsTab';
import SearchTab from '../components/SearchTab';
import LivePlayer from '../components/LivePlayer';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'home' | 'channels' | 'upcoming' | 'search'>('home');
  const [activeStream, setActiveStream] = useState<{
    title: string;
    subtitle?: string;
    sources: any[];
    id: string;
  } | null>(null);
  
  const [currentSlide, setCurrentSlide] = useState(0);
  const [channels, setChannels] = useState<Channel[]>(siteConfig.channels);
  const [isLoadingStreams, setIsLoadingStreams] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);

  // Load favorites on mount
  useEffect(() => {
    const savedFavorites = localStorage.getItem('favorite-channels');
    if (savedFavorites) {
      try {
        setFavorites(JSON.parse(savedFavorites));
      } catch (err) {
        console.error("Failed to parse favorites:", err);
      }
    }
  }, []);

  // Toggle favorite handler
  const toggleFavorite = (channelId: string) => {
    setFavorites(prev => {
      const updated = prev.includes(channelId)
        ? prev.filter(id => id !== channelId)
        : [...prev, channelId];
      localStorage.setItem('favorite-channels', JSON.stringify(updated));
      return updated;
    });
  };

  // Fetch dynamic IPTV streams
  useEffect(() => {
    setIsLoadingStreams(true);
    fetch('/api/streams')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          const dynamicChannels = data.map((item: any) => ({
            id: `iptv-${item.id}`,
            name: item.name,
            logoUrl: item.logoUrl,
            category: item.category || 'IPTV BD',
            isLive: item.status === 'Stable',
            metadata: `iptv-org • ${item.status}`,
            sources: [{
              id: `src-iptv-${item.id}`,
              name: 'Server 1',
              url: `/api/proxy?url=${encodeURIComponent(item.url)}`,
              status: item.status
            }]
          }));
          setChannels([...siteConfig.channels, ...dynamicChannels]);
        }
      })
      .catch(err => console.error("Failed to load dynamic streams:", err))
      .finally(() => setIsLoadingStreams(false));
  }, []);

  // Auto-advance slide carousel every 6 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % siteConfig.featuredSlides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const handleWatchMatch = (match: Match) => {
    setActiveStream({
      id: match.id,
      title: `${match.homeTeam.name} vs ${match.awayTeam.name}`,
      subtitle: match.tournament,
      sources: match.sources
    });
    // Scroll to top on mobile for player visibility
    if (window.innerWidth < 1024) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleWatchChannel = (channel: Channel) => {
    setActiveStream({
      id: channel.id,
      title: channel.name,
      subtitle: channel.metadata || channel.category,
      sources: channel.sources
    });
    if (window.innerWidth < 1024) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleClosePlayer = () => {
    setActiveStream(null);
  };

  // Get active slide info
  const featuredMatch = siteConfig.featuredSlides[currentSlide];
  const featuredHomeFlag = `https://flagcdn.com/w160/${featuredMatch.homeTeam.flagCode}.png`;
  const featuredAwayFlag = `https://flagcdn.com/w160/${featuredMatch.awayTeam.flagCode}.png`;

  // Filtered favorite channels
  const favoriteChannels = channels.filter(ch => favorites.includes(ch.id));

  return (
    <div className="w-full min-h-screen bg-[#090b10] text-[#f8fafc] pb-24 md:pb-12 md:pt-6">
      
      {/* Mobile Top Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-[#090b10]/95 backdrop-blur-md border-b border-white/5 px-4 py-3.5 flex justify-between items-center">
        <h1 className="text-lg font-black text-[#00b4d8] tracking-widest uppercase">
          {siteConfig.siteName}
        </h1>
        <div className="flex items-center gap-3">
          <Search 
            className="w-5 h-5 text-slate-400 cursor-pointer hover:text-white"
            onClick={() => setActiveTab('search')}
          />
          <MoreVertical className="w-5 h-5 text-slate-400 cursor-pointer" />
        </div>
      </div>

      {/* Main Grid Wrapper */}
      <div className="w-full max-w-6xl mx-auto px-4 mt-20 md:mt-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Player Container (sticky on desktop) */}
          {activeStream && (
            <div className="lg:col-span-7 lg:sticky lg:top-24 z-30 w-full">
              <LivePlayer 
                title={activeStream.title}
                subtitle={activeStream.subtitle}
                sources={activeStream.sources}
                onClose={handleClosePlayer}
              />
            </div>
          )}

          {/* Right Column: Listings and Content */}
          <div className={`${activeStream ? 'lg:col-span-5 lg:max-h-[calc(100vh-140px)] lg:overflow-y-auto no-scrollbar pb-12' : 'lg:col-span-12'} w-full`}>
            
            {/* Bottom Nav / Desktop Menu */}
            <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />

            {activeTab === 'home' && (
              <div className="w-full">
                
                {/* Search Input Bar (Mobile only) */}
                <div className="md:hidden w-full px-1 mb-6 mt-4">
                  <div 
                    onClick={() => setActiveTab('search')}
                    className="w-full bg-[#141821] border border-white/5 hover:border-white/10 rounded-xl p-3 flex items-center gap-3 cursor-pointer text-slate-500 hover:text-slate-400"
                  >
                    <Search className="w-4 h-4 text-slate-400" />
                    <span className="text-xs font-semibold">Search channels, events...</span>
                  </div>
                </div>

                {/* Featured Match Slide Banner (Carousel) - Shown only if no active stream is playing to save space on desktop */}
                {!activeStream && (
                  <div className="w-full mb-8 mt-4">
                    <div className="w-full aspect-[2.1/1] md:aspect-[3/1] rounded-3xl overflow-hidden relative border border-white/5 shadow-2xl group">
                      
                      {/* Banner Image overlay */}
                      <div className="absolute inset-0 bg-[#141821] flex justify-between items-center overflow-hidden">
                        <div className="w-1/2 h-full opacity-30 blur-2xl relative select-none">
                          <img src={featuredHomeFlag} className="w-full h-full object-cover" />
                        </div>
                        <div className="w-1/2 h-full opacity-30 blur-2xl relative select-none">
                          <img src={featuredAwayFlag} className="w-full h-full object-cover" />
                        </div>
                      </div>

                      {/* Dark gradient overlay */}
                      <div className="absolute inset-0 featured-overlay z-10 flex flex-col justify-between p-4 md:p-6">
                        <div className="flex justify-between items-center z-20">
                          <span className="text-[9px] md:text-xs font-extrabold uppercase bg-white/5 border border-white/10 px-3 py-1 rounded-full text-slate-200 tracking-wider">
                            {featuredMatch.tournament}
                          </span>
                          <span className="px-2.5 py-1 rounded-full bg-[#00b4d8]/10 border border-[#00b4d8]/20 text-[#00b4d8] text-[9px] md:text-xs font-extrabold uppercase flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#00b4d8]" /> Upcoming
                          </span>
                        </div>

                        <div className="flex items-center justify-center gap-6 md:gap-12 my-2 z-20">
                          <div className="w-14 h-14 md:w-20 md:h-20 rounded-full overflow-hidden border-2 border-white/10 shadow-lg p-0.5 shrink-0 bg-[#090b10]">
                            <img src={featuredHomeFlag} alt={featuredMatch.homeTeam.name} className="w-full h-full object-cover rounded-full" />
                          </div>
                          <div className="flex flex-col items-center">
                            <span className="text-xs md:text-sm font-black text-[#00b4d8] tracking-widest bg-[#00b4d8]/10 border border-[#00b4d8]/20 px-3 py-0.5 rounded-full">VS</span>
                          </div>
                          <div className="w-14 h-14 md:w-20 md:h-20 rounded-full overflow-hidden border-2 border-white/10 shadow-lg p-0.5 shrink-0 bg-[#090b10]">
                            <img src={featuredAwayFlag} alt={featuredMatch.awayTeam.name} className="w-full h-full object-cover rounded-full" />
                          </div>
                        </div>

                        <div className="flex items-end justify-between z-20 gap-4 mt-2">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-1.5">
                              <span className="text-base md:text-2xl font-black text-white leading-tight">
                                {featuredMatch.homeTeam.name} vs {featuredMatch.awayTeam.name}
                              </span>
                            </div>
                            {featuredMatch.startsIn && (
                              <span className="text-[10px] md:text-xs font-bold text-[#00b4d8] tracking-wider mt-1 uppercase">
                                Starts in: {featuredMatch.startsIn}
                              </span>
                            )}
                          </div>
                          
                          <button 
                            onClick={() => handleWatchMatch(featuredMatch)}
                            className="px-4 py-2.5 md:px-5 md:py-3 rounded-2xl bg-[#00b4d8] hover:bg-[#00b4d8]/80 text-[#090b10] font-black text-xs md:text-sm flex items-center gap-1.5 shadow-[0_4px_20px_rgba(0,180,216,0.3)] shrink-0 transition-transform hover:scale-105 active:scale-95"
                          >
                            <Info className="w-3.5 h-3.5 stroke-[2.5]" />
                            <span>DETAILS</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-center items-center gap-1.5 mt-3">
                      {siteConfig.featuredSlides.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setCurrentSlide(idx)}
                          className={`h-1.5 rounded-full transition-all duration-300 ${
                            currentSlide === idx ? 'w-6 bg-[#00b4d8]' : 'w-1.5 bg-slate-700'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Favorites section (if active) */}
                {favoriteChannels.length > 0 && (
                  <TrendingChannels 
                    channels={favoriteChannels} 
                    onSelectChannel={handleWatchChannel}
                    activeChannelId={activeStream?.id}
                    title="Your Favorites ❤️"
                    isLoading={isLoadingStreams}
                  />
                )}

                {/* Trending circular channels list */}
                <TrendingChannels 
                  channels={channels} 
                  onSelectChannel={handleWatchChannel}
                  activeChannelId={activeStream?.id}
                  title="Trending Channels"
                  isLoading={isLoadingStreams}
                />

                {/* Today's matches schedule */}
                <MatchSchedule 
                  schedules={siteConfig.schedules} 
                  onWatchMatch={handleWatchMatch}
                  activeMatchId={activeStream?.id}
                />

              </div>
            )}

            {activeTab === 'channels' && (
              <div className="mt-4">
                <ChannelsTab 
                  channels={channels}
                  onSelectChannel={handleWatchChannel}
                  activeChannelId={activeStream?.id}
                  isLoading={isLoadingStreams}
                  favorites={favorites}
                  onToggleFavorite={toggleFavorite}
                />
              </div>
            )}

            {activeTab === 'upcoming' && (
              <div className="mt-4">
                <MatchSchedule 
                  schedules={siteConfig.schedules.filter(m => m.status === 'upcoming')} 
                  onWatchMatch={handleWatchMatch}
                  activeMatchId={activeStream?.id}
                />
              </div>
            )}

            {activeTab === 'search' && (
              <div className="mt-4">
                <SearchTab 
                  channels={channels}
                  onSelectChannel={handleWatchChannel}
                  activeChannelId={activeStream?.id}
                  favorites={favorites}
                  onToggleFavorite={toggleFavorite}
                />
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
