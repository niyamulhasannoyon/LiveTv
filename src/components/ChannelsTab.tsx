"use client";

import React, { useState } from 'react';
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

export default function ChannelsTab({ 
  channels, 
  onSelectChannel, 
  activeChannelId, 
  isLoading = false,
  favorites = [],
  onToggleFavorite
}: ChannelsTabProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Extract unique categories and prepend Favorites category if favorites exist
  const categories = ['All'];
  if (favorites.length > 0) {
    categories.push('Favorites ❤️');
  }
  
  // Get list of other categories
  const otherCategories = Array.from(new Set(channels.map((ch) => ch.category)));
  categories.push(...otherCategories);

  const filteredChannels = channels.filter((channel) => {
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
    return categoryMatch && searchMatch;
  });

  return (
    <div className="w-full max-w-5xl mx-auto px-4 mb-24 mt-4">
      {/* Header and Search */}
      <div className="flex items-center justify-between mb-6">
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

      {/* Category Pills Slider */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-4 snap-x">
        {categories.map((category) => {
          const isActive = selectedCategory === category;
          // count total items in this category
          let count = 0;
          if (category === 'All') {
            count = channels.length;
          } else if (category === 'Favorites ❤️') {
            count = channels.filter(c => favorites.includes(c.id)).length;
          } else {
            count = channels.filter(c => c.category === category).length;
          }

          return (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full text-xs font-extrabold tracking-wider uppercase shrink-0 transition-all border snap-start ${
                isActive
                  ? 'bg-[#00b4d8]/10 text-[#00b4d8] border-[#00b4d8]'
                  : 'bg-white/5 border-white/5 hover:border-white/10 text-slate-400'
              }`}
            >
              {category} <span className="text-[9px] opacity-60 ml-1">{count}</span>
            </button>
          );
        })}
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
            const isActive = activeChannelId === channel.id;
            const isFavorite = favorites.includes(channel.id);
            return (
              <div
                key={channel.id}
                onClick={() => onSelectChannel(channel)}
                className={`glass-panel p-4 rounded-xl flex flex-col items-center justify-center relative cursor-pointer group transition-all duration-300 ${
                  isActive
                    ? 'border-[#00b4d8] shadow-[0_0_20px_rgba(0,180,216,0.3)] bg-[#141821]/80 scale-[1.02]'
                    : 'border-white/5 hover:border-white/10'
                }`}
              >
                {/* HD Badge */}
                <div className="absolute top-2.5 left-2.5 z-10">
                  <span className="px-1.5 py-0.5 rounded-md bg-[#00b4d8]/10 border border-[#00b4d8]/20 text-[#00b4d8] text-[8px] font-black uppercase">
                    HD
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
                <div className="w-16 h-16 rounded-full overflow-hidden border border-white/10 bg-[#090b10] flex items-center justify-center p-0.5 group-hover:scale-105 transition-transform duration-300 mb-4 shadow-md relative">
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
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 glass-panel rounded-xl border border-white/5 max-w-sm mx-auto">
          <p className="text-slate-400 font-bold mb-1">No channels found</p>
          <p className="text-slate-500 text-xs px-6">
            We couldn't find any channels in this category matching your search.
          </p>
        </div>
      )}
    </div>
  );
}
