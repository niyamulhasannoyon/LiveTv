"use client";

import React from 'react';
import { Calendar, Clock, Tv } from 'lucide-react';
import { Match } from '../config';

interface MatchScheduleProps {
  schedules: Match[];
  onWatchMatch: (match: Match) => void;
  activeMatchId?: string;
}

export default function MatchSchedule({ schedules, onWatchMatch, activeMatchId }: MatchScheduleProps) {
  return (
    <div className="w-full max-w-5xl mx-auto px-4 mb-24">
      {/* Heading */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm md:text-base font-extrabold tracking-wider text-white uppercase">
          Today's Schedule
        </h2>
        <span className="text-xs font-semibold text-[#00b4d8] cursor-pointer hover:underline">
          See All
        </span>
      </div>

      {/* Matches List */}
      <div className="space-y-4">
        {schedules.map((match) => {
          const isActive = activeMatchId === match.id;
          const isLive = match.status === 'live';
          
          // Flag CDN URLs
          const homeFlag = `https://flagcdn.com/w80/${match.homeTeam.flagCode}.png`;
          const awayFlag = `https://flagcdn.com/w80/${match.awayTeam.flagCode}.png`;

          return (
            <div
              key={match.id}
              onClick={() => onWatchMatch(match)}
              className={`glass-panel rounded-2xl relative overflow-hidden cursor-pointer transition-all duration-300 ${
                isActive 
                  ? 'border-[#00b4d8] bg-[#141821]/80 shadow-[0_0_20px_rgba(0,180,216,0.2)] scale-[1.01]' 
                  : 'border-white/5 hover:border-white/10 hover:bg-[#141821]/40'
              }`}
            >
              {/* Left Color Indicator border */}
              <div 
                className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                  isLive ? 'bg-rose-500' : 'bg-[#00b4d8]'
                }`}
              />

              {/* Card Inner Content */}
              <div className="pl-6 pr-6 py-4 flex flex-col gap-4">
                
                {/* Upper Metadata line */}
                <div className="flex justify-between items-center text-[10px] font-extrabold tracking-wider text-slate-400 uppercase">
                  <div className="flex items-center gap-2">
                    <span className={`w-1 h-3 rounded-full ${isLive ? 'bg-rose-500' : 'bg-[#00b4d8]'}`} />
                    <span>{match.tournament}</span>
                  </div>

                  <div>
                    {isLive ? (
                      <span className="px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-500 font-black flex items-center gap-1.5 live-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span> Live
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-slate-400 font-bold">
                        Upcoming
                      </span>
                    )}
                  </div>
                </div>

                {/* Scoreboard and teams row */}
                <div className="flex items-center justify-between py-2">
                  
                  {/* Home Team */}
                  <div className="flex flex-col items-center flex-1">
                    <div className="w-12 h-12 rounded-full overflow-hidden border border-white/10 bg-[#090b10] flex items-center justify-center p-0.5 shadow-md">
                      <img src={homeFlag} alt={match.homeTeam.name} className="w-full h-full object-cover rounded-full" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 mt-2 tracking-wide uppercase">
                      {match.homeTeam.code}
                    </span>
                  </div>

                  {/* Middle Time details */}
                  <div className="flex flex-col items-center justify-center text-center shrink-0 px-4 min-w-[120px]">
                    {isLive ? (
                      <>
                        <span className="text-sm font-black text-[#00b4d8] tracking-widest">VS</span>
                        {match.liveScore && (
                          <span className="text-[10px] font-extrabold text-rose-500 mt-1 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                            {match.liveScore}
                          </span>
                        )}
                      </>
                    ) : (
                      <>
                        <span className="text-sm font-extrabold text-white tracking-wide">
                          {match.time}
                        </span>
                        {match.startsIn && (
                          <span className="text-[9px] font-bold text-[#00b4d8] mt-1 bg-[#00b4d8]/10 px-2 py-0.5 rounded-full border border-[#00b4d8]/20">
                            {match.startsIn}
                          </span>
                        )}
                      </>
                    )}
                  </div>

                  {/* Away Team */}
                  <div className="flex flex-col items-center flex-1">
                    <div className="w-12 h-12 rounded-full overflow-hidden border border-white/10 bg-[#090b10] flex items-center justify-center p-0.5 shadow-md">
                      <img src={awayFlag} alt={match.awayTeam.name} className="w-full h-full object-cover rounded-full" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 mt-2 tracking-wide uppercase">
                      {match.awayTeam.code}
                    </span>
                  </div>

                </div>

              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
