"use client";

import React, { useState, useMemo } from 'react';
import { Search, Heart } from 'lucide-react';
import { Channel } from '../config';
import SafeImage from './SafeImage';

interface ChannelsTabProps {
  channels: Channel[];
  onSelectChannel: (channel: Channel) => void;
  activeChannelId?: string;
  isLoading?: boolean;
  favorites: string[];
  onToggleFavorite: (id: string) => void;
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
    case 'Favorites ❤️': return '⭐ Bookmarks';
    case 'Sports': return '⚽ Sports';
    case 'News': return '📰 News';
    case 'Movies': return '🍿 Movies';
    case 'Kids': return '👶 Kids';
    case 'Entertainment': return '🎭 Entertainment';
    default: return catName;
  }
};

export default function ChannelsTab({ 
  channels, 
  onSelectChannel, 
  activeChannelId, 
  isLoading = false,
  favorites = [],
  onToggleFavorite
}: ChannelsTabProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedCountry, setSelectedCountry] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Extract unique categories and prepend Favorites category if favorites exist
  const categories = useMemo(() => {
    const list = ['All'];
    if (favorites.length > 0) {
      list.push('Favorites ❤️');
    }
    const otherCategories = Array.from(new Set(channels.map((ch) => ch.category)));
    list.push(...otherCategories);
    return list;
  }, [channels, favorites]);

  // Extract unique countries
  const countries = useMemo(() => {
    const list = channels.map(ch => ch.country || 'Global Sports').filter(Boolean);
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

  const filteredChannels = useMemo(() => {
    return channels.filter((channel) => {
      // Country match
      const countryMatch = selectedCountry === 'All' || (channel.country || 'Global Sports') === selectedCountry;

      // Category match
      let categoryMatch = false;
      if (selectedCategory === 'All') {
        categoryMatch = true;
      } else if (selectedCategory === 'Favorites ❤️') {
        categoryMatch = favorites.includes(channel.id);
      } else {
        categoryMatch = channel.category === selectedCategory;
      }

      // Search query match
      const searchMatch = channel.name.toLowerCase().includes(searchQuery.toLowerCase());
      return countryMatch && categoryMatch && searchMatch;
    });
  }, [channels, selectedCategory, selectedCountry, favorites, searchQuery]);

  return (
    <div className="w-full max-w-5xl mx-auto px-4 mb-24 mt-4">
      {/* Header and Search */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl md:text-2xl font-black text-white tracking-widest uppercase">
          Channels
        </h1>
        <div className="relative w-48 md:w-64">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search channels..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-full text-xs glass-input border border-white/10 text-white focus:outline-none transition-all placeholder:text-slate-500"
          />
        </div>
      </div>

      {/* Filter Sections Wrapper */}
      <div className="space-y-3 mb-6 bg-[#141821]/40 border border-white/5 p-4 rounded-2xl">
        {/* Country Pills Slider */}
        <div className="space-y-1.5">
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block ml-1">Filter By Country</span>
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 snap-x">
            {countries.map((country) => {
              const isActive = selectedCountry === country;
              // count total items in this country under selected category
              let count = 0;
              const categoryFiltered = selectedCategory === 'All'
                ? channels
                : selectedCategory === 'Favorites ❤️'
                  ? channels.filter(c => favorites.includes(c.id))
                  : channels.filter(c => c.category === selectedCategory);

              if (country === 'All') {
                count = categoryFiltered.length;
              } else {
                count = categoryFiltered.filter(c => (c.country || 'Global Sports') === country).length;
              }

              return (
                <button
                  key={country}
                  onClick={() => setSelectedCountry(country)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold tracking-wider uppercase shrink-0 transition-all border snap-start flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-[#00b4d8]/10 text-[#00b4d8] border-[#00b4d8]'
                      : 'bg-white/5 border-white/5 hover:border-white/10 text-slate-400'
                  }`}
                >
                  <span>{country === 'All' ? '🌐' : getCountryIcon(country)}</span>
                  <span>{country === 'All' ? 'All' : country}</span>
                  <span className="text-[9px] opacity-60 ml-0.5 bg-black/20 px-1.5 py-0.5 rounded-full">{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Category Pills Slider */}
        <div className="space-y-1.5 border-t border-white/5 pt-3">
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block ml-1">Filter By Category</span>
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 snap-x">
            {categories.map((category) => {
              const isActive = selectedCategory === category;
              // count total items in this category under selected country
              let count = 0;
              const countryFiltered = selectedCountry === 'All'
                ? channels
                : channels.filter(c => (c.country || 'Global Sports') === selectedCountry);

              if (category === 'All') {
                count = countryFiltered.length;
              } else if (category === 'Favorites ❤️') {
                count = countryFiltered.filter(c => favorites.includes(c.id)).length;
              } else {
                count = countryFiltered.filter(c => c.category === category).length;
              }

              return (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold tracking-wider uppercase shrink-0 transition-all border snap-start ${
                    isActive
                      ? 'bg-[#00b4d8]/10 text-[#00b4d8] border-[#00b4d8]'
                      : 'bg-white/5 border-white/5 hover:border-white/10 text-slate-400'
                  }`}
                >
                  {getCategoryDisplayName(category)} <span className="text-[9px] opacity-60 ml-1 bg-black/20 px-1.5 py-0.5 rounded-full">{count}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Grid of channels */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, idx) => (
            <div
              key={`skeleton-ch-${idx}`}
              className="glass-panel p-4 rounded-xl flex flex-col items-center justify-center relative border border-white/5 h-40"
            >
              <div className="w-16 h-16 rounded-full bg-white/5 mb-4 shadow-md shimmer" />
              <div className="h-3 w-16 bg-white/5 rounded-full shimmer" />
            </div>
          ))}
        </div>
      ) : filteredChannels.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredChannels.map((channel) => {
            const isActive = activeChannelId === channel.name; // using name mapping
            const isFavorite = favorites.includes(channel.id);
            return (
              <div
                key={channel.id}
                onClick={() => onSelectChannel(channel)}
                className={`glass-panel p-4 rounded-xl flex flex-col items-center justify-center relative cursor-pointer group transition-all duration-300 ${
                  isActive
                    ? 'border-[#00b4d8] shadow-[0_0_20px_rgba(0,180,216,0.3)] bg-[#141821]/80 scale-[1.02]'
                    : 'border-white/5 hover:border-white/10 bg-[#141821]/30'
                }`}
              >
                {/* Badges */}
                <div className="absolute top-2.5 left-2.5 z-10 flex flex-col gap-1 items-start">
                  <span className="px-1.5 py-0.5 rounded bg-[#00b4d8]/10 border border-[#00b4d8]/20 text-[#00b4d8] text-[8px] font-black uppercase">
                    HD
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-black/40 border border-white/5 text-slate-300 text-[8px] font-bold flex items-center gap-0.5">
                    {getCountryIcon(channel.country || 'Global Sports')} {channel.country || 'Global'}
                  </span>
                </div>

                {/* Favorite Heart Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(channel.id);
                  }}
                  className="absolute top-2 right-2 z-20 p-1.5 rounded-lg bg-black/40 hover:bg-black/60 border border-white/5 text-slate-400 hover:text-rose-500 transition-all opacity-100 sm:opacity-0 group-hover:opacity-100"
                  title={isFavorite ? "Remove from Favorites" : "Add to Favorites"}
                >
                  <Heart className={`w-3.5 h-3.5 transition-all ${isFavorite ? 'fill-rose-500 text-rose-500 scale-110' : 'text-slate-400'}`} />
                </button>

                {/* Circle Logo */}
                <div className="w-16 h-16 rounded-full overflow-hidden border border-white/10 bg-[#090b10] flex items-center justify-center p-0.5 group-hover:scale-105 transition-transform duration-300 mb-4 mt-6 shadow-md relative">
                  <SafeImage
                    src={channel.logoUrl}
                    alt={channel.name}
                    fill
                    sizes="64px"
                    className="object-cover rounded-full"
                  />
                </div>

                {/* Name */}
                <span className="text-xs font-bold text-slate-200 text-center tracking-wide truncate w-full group-hover:text-white transition-colors">
                  {channel.name}
                </span>
                
                {/* Subtitle category */}
                <span className="text-[9px] font-semibold text-slate-500 mt-1 uppercase tracking-wider">
                  {channel.category}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 glass-panel rounded-xl border border-white/5 max-w-sm mx-auto bg-[#141821]/20">
          {selectedCategory === 'Favorites ❤️' && favorites.length === 0 ? (
            <>
              <Heart className="w-10 h-10 text-rose-500/40 mx-auto mb-3" />
              <p className="text-slate-300 font-bold mb-1">No Bookmarked Channels</p>
              <p className="text-slate-500 text-xs px-6 mb-4 leading-relaxed">
                Click the heart icon on any channel card to add it to your bookmarks list.
              </p>
              <button
                onClick={() => setSelectedCategory('All')}
                className="px-4 py-2 rounded-full bg-[#00b4d8]/10 text-[#00b4d8] border border-[#00b4d8]/20 text-xs font-bold uppercase hover:bg-[#00b4d8]/20 transition-all cursor-pointer"
              >
                View All Channels
              </button>
            </>
          ) : (
            <>
              <p className="text-slate-400 font-bold mb-1">No channels found</p>
              <p className="text-slate-500 text-xs px-6 leading-relaxed">
                We couldn't find any channels matching the selected country and category.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
