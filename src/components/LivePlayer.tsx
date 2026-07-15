"use client";

import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { 
  Play, Pause, Volume2, VolumeX, Maximize2, RefreshCw, X, Radio, Tv, PictureInPicture
} from 'lucide-react';
import { StreamSource } from '../config';

interface LivePlayerProps {
  title: string;
  subtitle?: string;
  sources: StreamSource[];
  onClose: () => void;
}

export default function LivePlayer({ title, subtitle, sources, onClose }: LivePlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const [activeSource, setActiveSource] = useState<StreamSource | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(80);
  const [isError, setIsError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  // New features state
  const [isPipAvailable, setIsPipAvailable] = useState(false);
  const [failedSourceIds, setFailedSourceIds] = useState<string[]>([]);
  const [showPlayStateIndicator, setShowPlayStateIndicator] = useState<'play' | 'pause' | null>(null);

  // Load volume from localStorage on mount
  useEffect(() => {
    const savedVolume = localStorage.getItem('player-volume');
    if (savedVolume !== null) {
      setVolume(Number(savedVolume));
    }
  }, []);

  // Save volume to localStorage on change
  useEffect(() => {
    localStorage.setItem('player-volume', volume.toString());
  }, [volume]);

  // Check PiP availability on mount
  useEffect(() => {
    setIsPipAvailable(
      typeof document !== 'undefined' &&
      'pictureInPictureEnabled' in document &&
      document.pictureInPictureEnabled
    );
  }, []);

  // Set first source as active when sources change
  useEffect(() => {
    setFailedSourceIds([]);
    if (sources && sources.length > 0) {
      setActiveSource(sources[0]);
      setIsError(false);
      setIsPlaying(true);
    } else {
      setActiveSource(null);
    }
  }, [sources]);

  // Mirror Failover Recovery Handler
  const handleStreamError = () => {
    if (!activeSource) return;
    
    const currentFailed = [...failedSourceIds, activeSource.id];
    setFailedSourceIds(currentFailed);

    // Find next untried source URL
    const nextSource = sources.find(src => !currentFailed.includes(src.id));
    if (nextSource) {
      setActiveSource(nextSource);
      setIsError(false);
      console.warn(`Stream playback failed. Trying alternative mirror: ${nextSource.name}`);
    } else {
      setIsError(true);
    }
  };

  // HLS logic setup
  useEffect(() => {
    if (!activeSource || activeSource.isEmbed) return;
    
    const video = videoRef.current;
    if (!video) return;

    let hls: Hls | null = null;
    video.muted = isMuted;
    video.volume = volume / 100;
    video.src = ''; // reset previous source

    const handleError = () => {
      handleStreamError();
    };

    if (Hls.isSupported() && activeSource.url.includes('.m3u8')) {
      hls = new Hls({
        capLevelToPlayerSize: true,
        maxBufferLength: 30,
      });
      hls.loadSource(activeSource.url);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(handleError);
      });
      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          handleError();
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS support (Safari)
      video.src = activeSource.url;
      const onMetadataLoaded = () => {
        video.play().catch(handleError);
      };
      video.addEventListener('loadedmetadata', onMetadataLoaded);
      return () => {
        video.removeEventListener('loadedmetadata', onMetadataLoaded);
      };
    } else {
      // Standard video format (mp4 etc)
      video.src = activeSource.url;
      video.play().catch(handleError);
    }

    return () => {
      if (hls) hls.destroy();
    };
  }, [activeSource, reloadKey, failedSourceIds]);

  // Sync volume state to video element
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.volume = volume / 100;
      video.muted = isMuted;
    }
  }, [volume, isMuted]);

  const triggerPlayStateIndicator = (state: 'play' | 'pause') => {
    setShowPlayStateIndicator(state);
    const timeout = setTimeout(() => setShowPlayStateIndicator(null), 800);
    return () => clearTimeout(timeout);
  };

  const handlePlayToggle = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
      triggerPlayStateIndicator('pause');
    } else {
      video.play().catch(() => handleStreamError());
      setIsPlaying(true);
      triggerPlayStateIndicator('play');
    }
  };

  const handleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen().catch((err) => {
        console.error("Fullscreen error:", err.message);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const handlePiPToggle = async () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await video.requestPictureInPicture();
      }
    } catch (err) {
      console.error("Picture-in-Picture error:", err);
    }
  };

  const handleRefresh = () => {
    setIsError(false);
    setFailedSourceIds([]);
    setReloadKey(prev => prev + 1);
  };

  return (
    <div className="w-full max-w-5xl mx-auto mb-6">
      {/* Player Frame Card */}
      <div 
        ref={containerRef} 
        className="w-full relative aspect-video rounded-3xl overflow-hidden glass-panel border border-white/10 player-shadow bg-black flex flex-col group/player"
      >
        {/* Close Button overlay */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-30 p-2.5 rounded-full bg-black/60 hover:bg-black border border-white/10 text-white hover:text-[#00b4d8] transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Video Screen Viewport */}
        <div className="flex-1 w-full h-full relative overflow-hidden flex items-center justify-center">
          {isError ? (
            <div className="text-center p-6 glass-panel rounded-2xl max-w-xs border-white/10 z-20">
              <p className="text-rose-500 font-extrabold text-xs uppercase tracking-wider mb-2">Stream Error</p>
              <p className="text-slate-400 text-[11px] leading-relaxed mb-4">
                Unable to load this feed. The stream might be offline.
              </p>
              <button 
                onClick={handleRefresh}
                className="px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-bold text-white transition-all"
              >
                Retry Stream
              </button>
            </div>
          ) : activeSource?.isEmbed ? (
            <iframe 
              src={activeSource.url} 
              className="w-full h-full border-0 z-10"
              allowFullScreen
              allow="autoplay; encrypted-media"
            />
          ) : (
            <video 
              ref={videoRef}
              className="w-full h-full object-contain z-10"
              playsInline
              onClick={handlePlayToggle}
              autoPlay
            />
          )}

          {/* Play/Pause custom overlay animation indicator */}
          {showPlayStateIndicator && (
            <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
              <div className="p-4 rounded-full bg-black/70 text-white backdrop-blur-md border border-white/10 animate-ping">
                {showPlayStateIndicator === 'play' ? (
                  <Play className="w-6 h-6 fill-current ml-0.5 text-[#00b4d8]" />
                ) : (
                  <Pause className="w-6 h-6 fill-current text-[#00b4d8]" />
                )}
              </div>
            </div>
          )}

          {/* Live pulsing tag over player */}
          {!isError && activeSource && (
            <div className="absolute top-4 left-4 z-20 flex items-center gap-1.5 bg-black/55 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/5 text-[9px] font-black text-white pointer-events-none">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
              <span className="text-rose-500 uppercase tracking-widest">LIVE</span>
            </div>
          )}
        </div>

        {/* Custom Mini Player Controls Panel */}
        <div className="bg-[#090b10]/95 border-t border-white/5 px-4 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3 z-20">
          {/* Title and Active Source */}
          <div className="flex flex-col">
            <h2 className="text-sm font-black text-white tracking-wide truncate max-w-[250px]">
              {title}
            </h2>
            {subtitle && (
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">
                {subtitle}
              </span>
            )}
          </div>

          {/* Media control icons */}
          <div className="flex items-center gap-2">
            {/* Play Pause */}
            {!activeSource?.isEmbed && (
              <button 
                onClick={handlePlayToggle}
                className="w-8 h-8 rounded-lg bg-[#00b4d8] hover:bg-[#00b4d8]/80 text-white flex items-center justify-center transition-all"
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
              </button>
            )}

            {/* Mute and Volume */}
            {!activeSource?.isEmbed && (
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setIsMuted(!isMuted)}
                  className="w-8 h-8 rounded-lg border border-white/5 bg-white/5 text-slate-300 hover:text-white flex items-center justify-center transition-all"
                >
                  {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-500" /> : <Volume2 className="w-3.5 h-3.5" />}
                </button>
                <input 
                  type="range"
                  min="0"
                  max="100"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => {
                    setVolume(Number(e.target.value));
                    if (isMuted) setIsMuted(false);
                  }}
                  className="w-16 accent-[#00b4d8] h-1 rounded-lg bg-slate-800 cursor-pointer hidden sm:block"
                />
              </div>
            )}

            {/* Refresh */}
            {!activeSource?.isEmbed && (
              <button 
                onClick={handleRefresh}
                className="w-8 h-8 rounded-lg border border-white/5 bg-white/5 text-slate-300 hover:text-white flex items-center justify-center transition-all"
                title="Refresh Stream"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            )}

            {/* PiP */}
            {!activeSource?.isEmbed && isPipAvailable && (
              <button 
                onClick={handlePiPToggle}
                className="w-8 h-8 rounded-lg border border-white/5 bg-white/5 text-slate-300 hover:text-white flex items-center justify-center transition-all"
                title="Picture-in-Picture"
              >
                <PictureInPicture className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Fullscreen */}
            <button 
              onClick={handleFullscreen}
              className="w-8 h-8 rounded-lg border border-white/5 bg-white/5 text-slate-300 hover:text-white flex items-center justify-center transition-all"
              title="Fullscreen"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Server listings bottom selector */}
        {sources.length > 1 && (
          <div className="bg-[#0f131a] border-t border-white/5 px-4 py-2.5 flex items-center gap-2 overflow-x-auto no-scrollbar z-20">
            <span className="text-[10px] font-extrabold uppercase text-slate-500 mr-2">Servers:</span>
            {sources.map((source) => {
              const isSelected = activeSource?.id === source.id;
              return (
                <button
                  key={source.id}
                  onClick={() => setActiveSource(source)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all shrink-0 border ${
                    isSelected
                      ? 'bg-[#00b4d8]/10 border-[#00b4d8] text-[#00b4d8]'
                      : 'bg-white/5 border-white/5 text-slate-400 hover:text-white'
                  }`}
                >
                  {source.name}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
