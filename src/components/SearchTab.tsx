"use client";

import React, { useState } from 'react';
import { Search as SearchIcon, Heart } from 'lucide-react';
import { Channel } from '../config';
import SafeImage from './SafeImage';

interface SearchTabProps {
  channels: Channel[];
  onSelectChannel: (channel: Channel) => void;
  activeChannelId?: string;
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

export default function SearchTab({ 
  channels, 
  onSelectChannel, 
  activeChannelId,
  favorites = [],
  onToggleFavorite
}: SearchTabProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const popularSearches = [
    { label: 'Football', emoji: '⚽' },
    { label: 'Cricket', emoji: '🏏' },
    { label: 'Live', emoji: '🔥' },
    { label: 'Movies', emoji: '🍿' },
    { label: 'Sports', emoji: '📺' },
    { label: 'News', emoji: '🌐' },
  ] as const;

  const handlePopularSearch = (label: string) => {
    setSearchQuery(label);
  };

  const filteredChannels = channels.filter((channel) => {
    if (!searchQuery) return true; // recommended channels
    const query = searchQuery.toLowerCase().trim();
    return (
      channel.name.toLowerCase().includes(query) ||
      channel.category.toLowerCase().includes(query) ||
      (channel.metadata || '').toLowerCase().includes(query)
    );
  });

  return (
    <div className="w-full max-w-2xl mx-auto px-4 mb-24 mt-4">
      {/* Search Input Bar */}
      <div className="relative w-full mb-8">
        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
        <input
          type="text"
          placeholder="Search channels, teams, sports..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3.5 rounded-xl text-sm glass-input border border-white/10 text-white focus:outline-none transition-all placeholder:text-slate-500 font-medium"
        />
      </div>

      {/* Popular Searches */}
      <div className="mb-8">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
          Popular Searches
        </h3>
        <div className="flex flex-wrap gap-2.5">
          {popularSearches.map((item) => (
            <button
              key={item.label}
              onClick={() => handlePopularSearch(item.label)}
              className="px-4 py-2 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 text-slate-200 text-xs font-semibold flex items-center gap-2 transition-all"
            >
              <span>{item.emoji}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Recommended Channels List */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
          {searchQuery ? 'Search Results' : 'Recommended Channels'}
        </h3>
        <div className="space-y-3">
          {filteredChannels.length > 0 ? (
            filteredChannels.map((channel) => {
              const isActive = activeChannelId === channel.id;
              const isFavorite = favorites.includes(channel.id);
              return (
                <div
                  key={channel.id}
                  onClick={() => onSelectChannel(channel)}
                  className={`glass-panel p-3.5 rounded-2xl flex items-center justify-between border cursor-pointer hover:bg-white/5 transition-all ${
                    isActive 
                      ? 'border-[#00b4d8] bg-[#00b4d8]/5 shadow-[0_0_15px_rgba(0,180,216,0.15)]' 
                      : 'border-white/5'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {/* Circle Logo */}
                    <div className="w-12 h-12 rounded-full overflow-hidden border border-white/10 bg-[#090b10] flex items-center justify-center p-0.5 shrink-0 shadow-inner relative">
                      <SafeImage
                        src={channel.logoUrl}
                        alt={channel.name}
                        fill
                        sizes="48px"
                        className="object-cover rounded-full"
                      />
                    </div>
                    {/* Channel Metadata */}
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-white tracking-wide">
                        {channel.name}
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold mt-0.5 uppercase tracking-wider flex items-center gap-1.5">
                        <span>{channel.category}</span>
                        <span>•</span>
                        <span className="text-slate-300 font-bold flex items-center gap-0.5">
                          <span>{getCountryIcon(channel.country || 'Global Sports')}</span>
                          <span>{channel.country || 'Global Sports'}</span>
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* Badges / Live Indicator / Favorite Heart */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(channel.id);
                      }}
                      className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-slate-400 hover:text-rose-500 transition-all"
                      title={isFavorite ? "Remove from Favorites" : "Add to Favorites"}
                    >
                      <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-rose-500 text-rose-500 scale-110' : 'text-slate-400'}`} />
                    </button>

                    {channel.isLive && (
                      <span className="px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[9px] font-black uppercase flex items-center gap-1.5 live-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span> Live
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-12 text-slate-500 text-xs">
              No matching channels or events found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
