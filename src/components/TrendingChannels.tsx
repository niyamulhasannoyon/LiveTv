"use client";

import React from 'react';
import { Channel } from '../config';

interface TrendingChannelsProps {
  channels: Channel[];
  onSelectChannel: (channel: Channel) => void;
  activeChannelId?: string;
  title?: string;
  isLoading?: boolean;
}

export default function TrendingChannels({ 
  channels, 
  onSelectChannel, 
  activeChannelId, 
  title = "Trending Channels", 
  isLoading = false 
}: TrendingChannelsProps) {
  return (
    <div className="w-full max-w-5xl mx-auto px-4 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm md:text-base font-extrabold tracking-wider text-white uppercase">
          {title}
        </h2>
        {channels.length > 0 && !isLoading && (
          <span className="text-xs font-semibold text-[#00b4d8] cursor-pointer hover:underline">
            See All
          </span>
        )}
      </div>

      {/* Horizontal Scroll List */}
      <div className="flex items-center gap-6 overflow-x-auto no-scrollbar pb-3 snap-x">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, idx) => (
            <div 
              key={`trend-skeleton-${idx}`} 
              className="flex flex-col items-center gap-2 shrink-0 snap-start w-20"
            >
              {/* Circular Shimmer */}
              <div className="w-16 h-16 rounded-full bg-white/5 border border-white/5 animate-pulse flex items-center justify-center p-0.5" />
              <div className="h-2 w-12 bg-white/5 rounded animate-pulse" />
            </div>
          ))
        ) : channels.length > 0 ? (
          channels.map((channel) => {
            const isActive = activeChannelId === channel.id;
            return (
              <div
                key={channel.id}
                onClick={() => onSelectChannel(channel)}
                className="flex flex-col items-center gap-2 shrink-0 cursor-pointer snap-start w-20"
              >
                {/* Circular Logo Container */}
                <div 
                  className={`w-16 h-16 rounded-full overflow-hidden border bg-[#141821] flex items-center justify-center transition-all p-0.5 ${
                    isActive 
                      ? 'border-[#00b4d8] ring-2 ring-[#00b4d8]/20 shadow-[0_0_15px_rgba(0,180,216,0.4)] scale-105' 
                      : 'border-white/10 hover:border-white/20'
                  }`}
                >
                  <img 
                    src={channel.logoUrl} 
                    alt={channel.name} 
                    className="w-full h-full object-cover rounded-full" 
                  />
                </div>
                <span className="text-[10px] font-bold text-center text-slate-300 truncate w-full group-hover:text-white">
                  {channel.name}
                </span>
              </div>
            );
          })
        ) : (
          <div className="text-slate-500 text-xs py-2 w-full text-center">
            No channels available.
          </div>
        )}
      </div>
    </div>
  );
}
