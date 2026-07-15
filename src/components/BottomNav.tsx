"use client";

import React from 'react';
import { Home, Tv, Calendar } from 'lucide-react';

interface BottomNavProps {
  activeTab: 'home' | 'channels' | 'upcoming' | 'search';
  setActiveTab: (tab: 'home' | 'channels' | 'upcoming' | 'search') => void;
}

export default function BottomNav({ activeTab, setActiveTab }: BottomNavProps) {
  const tabs = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'channels', label: 'Channels', icon: Tv },
    { id: 'upcoming', label: 'Upcoming', icon: Calendar },
  ] as const;

  return (
    /* Mobile Bottom Navigation */
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#090b10]/95 backdrop-blur-md border-t border-white/5 md:hidden flex justify-around items-center py-2.5 pb-5">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center gap-1.5 transition-colors ${
              isActive ? 'text-[#00b4d8]' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[2]'}`} />
            <span className="text-[10px] font-semibold tracking-wider uppercase">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}

