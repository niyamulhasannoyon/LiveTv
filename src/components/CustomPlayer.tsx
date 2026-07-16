/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import React, { useRef, useState, useEffect } from 'react';
import Hls from 'hls.js';
import { Play, Pause, Volume2, VolumeX, Maximize2, RefreshCw, Tv } from 'lucide-react';

interface CustomPlayerProps {
  urls: string[];
  channelName?: string;
}

function getEmbedUrl(url: string): string | null {
  if (!url) return null;
  
  // YouTube watch or short links
  const ytWatchMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([a-zA-Z0-9_-]+)/);
  if (ytWatchMatch) {
    return `https://www.youtube.com/embed/${ytWatchMatch[1]}?autoplay=1&mute=1`;
  }
  
  // YouTube live channel handle links (e.g. youtube.com/@handle/live)
  const ytLiveMatch = url.match(/youtube\.com\/@([a-zA-Z0-9_-]+)\/live/);
  if (ytLiveMatch) {
    return `https://www.youtube.com/embed/live_stream?channel=${ytLiveMatch[1]}`;
  }

  // Embed links
  if (url.includes('youtube.com/embed/')) {
    return url;
  }
  
  // Twitch links
  const twitchMatch = url.match(/twitch\.tv\/([a-zA-Z0-9_-]+)/);
  if (twitchMatch) {
    const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    return `https://player.twitch.tv/?channel=${twitchMatch[1]}&parent=${host}&autoplay=true&muted=true`;
  }
  
  return null;
}

export default function CustomPlayer({ urls = [], channelName }: CustomPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [urlIndex, setUrlIndex] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [showControls, setShowControls] = useState(true);
  const [showIndicator, setShowIndicator] = useState<'play' | 'pause' | null>(null);

  const currentStream = urls[urlIndex] || '';
  const embedUrl = getEmbedUrl(currentStream);
  const isEmbed = !!embedUrl;

  // Reset stream index when urls change
  useEffect(() => {
    setUrlIndex(0);
    setStatusMessage('');
  }, [urls]);

  // Load volume from local storage
  useEffect(() => {
    const saved = localStorage.getItem('player-volume');
    if (saved !== null) {
      setVolume(Number(saved));
    }
  }, []);

  // Save volume changes
  useEffect(() => {
    localStorage.setItem('player-volume', volume.toString());
    if (videoRef.current && !isEmbed) {
      videoRef.current.volume = volume;
    }
  }, [volume, isEmbed]);

  // Main playback and HLS validation logic
  useEffect(() => {
    if (isEmbed) {
      const timer = setTimeout(() => {
        setIsPlaying(true);
      }, 0);
      return () => clearTimeout(timer);
    }

    const video = videoRef.current;
    if (!video || !urls || urls.length === 0) return;

    let currentStream = urls[urlIndex];
    if (currentStream && (currentStream.startsWith('http://') || currentStream.startsWith('https://')) && !isEmbed) {
      currentStream = `/api/stream?url=${encodeURIComponent(currentStream)}`;
    }
    let hls: Hls | null = null;

    const reportError = async (failedUrl: string) => {
      if (!channelName) return;
      try {
        await fetch('/api/channels/report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ channelName, url: failedUrl })
        });
      } catch (err) {
        console.error('Error reporting stream failure:', err);
      }
    };

    const triggerFallback = () => {
      const failedUrl = urls[urlIndex];
      reportError(failedUrl);

      if (urlIndex < urls.length - 1) {
        setStatusMessage(`Source ${urlIndex + 1} offline. Connecting backup source ${urlIndex + 2}...`);
        setTimeout(() => {
          setUrlIndex(prev => prev + 1);
          setStatusMessage('');
        }, 2500);
      } else {
        setStatusMessage('Error: All stream networks for this channel are offline.');
        setIsPlaying(false);
      }
    };

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = currentStream;
      video.onerror = () => triggerFallback();
      video.play().then(() => setIsPlaying(true)).catch(() => {});
    } else if (Hls.isSupported()) {
      hls = new Hls({ 
        maxMaxBufferLength: 8, 
        manifestLoadingMaxRetry: 2,
        enableWorker: true
      });
      hls.loadSource(currentStream);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().then(() => setIsPlaying(true)).catch(() => {});
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.warn("Network error caught. Initiating backup URL failover...");
              triggerFallback();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.warn("Media playback error caught. Attempting recovery...");
              hls?.recoverMediaError();
              break;
            default:
              console.error("Unrecoverable playback error. Running fallback...");
              triggerFallback();
              break;
          }
        }
      });
    }

    return () => {
      if (hls) hls.destroy();
    };
  }, [urls, urlIndex, isEmbed, channelName]);

  // Controls auto-hide trigger on cursor inactivity
  useEffect(() => {
    if (!isPlaying) {
      setShowControls(true);
      return;
    }
    
    let hideTimeout: NodeJS.Timeout;
    const handleMouseMove = () => {
      setShowControls(true);
      clearTimeout(hideTimeout);
      hideTimeout = setTimeout(() => {
        if (isPlaying) {
          setShowControls(false);
        }
      }, 3000); // Hide controls after 3 seconds of inactivity
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('mousemove', handleMouseMove);
    }

    // Initialize timeout
    hideTimeout = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);

    return () => {
      if (container) {
        container.removeEventListener('mousemove', handleMouseMove);
      }
      clearTimeout(hideTimeout);
    };
  }, [isPlaying, showControls]);

  const triggerIndicator = (state: 'play' | 'pause') => {
    setShowIndicator(state);
    const timeout = setTimeout(() => setShowIndicator(null), 800);
    return () => clearTimeout(timeout);
  };

  const togglePlay = () => {
    if (isEmbed) return;
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play().then(() => {
        setIsPlaying(true);
        triggerIndicator('play');
      }).catch(() => {});
    } else {
      video.pause();
      setIsPlaying(false);
      triggerIndicator('pause');
    }
  };

  const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isEmbed) return;
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
    }
    setIsMuted(val === 0);
  };

  const toggleMute = () => {
    if (isEmbed) return;
    setIsMuted(prev => {
      const targetMute = !prev;
      if (videoRef.current) {
        videoRef.current.muted = targetMute;
      }
      if (targetMute === false) {
        setVolume(v => {
          if (v === 0) {
            if (videoRef.current) videoRef.current.volume = 0.5;
            return 0.5;
          }
          return v;
        });
      }
      return targetMute;
    });
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen().catch(err => {
        console.error("Fullscreen error:", err);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const togglePictureInPicture = async () => {
    if (isEmbed) return;
    const video = videoRef.current;
    if (!video) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (document.pictureInPictureEnabled) {
        await video.requestPictureInPicture();
      } else {
        alert("Picture-in-Picture mode is not supported by your browser.");
      }
    } catch (err) {
      console.error("Failed to enter Picture-in-Picture:", err);
    }
  };

  // Keyboard controls listener setup
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
         activeEl.tagName === 'TEXTAREA' ||
         activeEl.getAttribute('contenteditable') === 'true')
      ) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case ' ': // Space for play/pause
          e.preventDefault();
          if (!isEmbed) togglePlay();
          break;
        case 'm': // M for mute/unmute
          e.preventDefault();
          if (!isEmbed) toggleMute();
          break;
        case 'f': // F for fullscreen
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'p': // P for picture-in-picture
          e.preventDefault();
          if (!isEmbed) togglePictureInPicture();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEmbed]);

  const handleManualRefresh = () => {
    setStatusMessage('');
    setUrlIndex(0);
    if (videoRef.current) {
      videoRef.current.load();
    }
  };

  return (
    <div 
      ref={containerRef}
      onMouseEnter={() => setShowControls(true)}
      className="relative group w-full aspect-video bg-black rounded-3xl overflow-hidden shadow-[0_15px_40px_rgba(0,0,0,0.6)] border border-white/5"
    >
      {/* Fallback & Buffer Status Notice overlay */}
      {statusMessage && (
        <div className="absolute inset-0 bg-[#090b10]/90 backdrop-blur-md flex items-center justify-center p-4 text-center z-20 text-yellow-400 font-medium text-xs md:text-sm animate-pulse tracking-wide select-none">
          {statusMessage}
        </div>
      )}

      {/* Main Video element or Iframe Embed */}
      {isEmbed ? (
        <iframe 
          src={embedUrl} 
          className="w-full h-full border-0 z-10"
          allowFullScreen
          allow="autoplay; encrypted-media; picture-in-picture"
        />
      ) : (
        <video 
          ref={videoRef} 
          onClick={togglePlay}
          className="w-full h-full cursor-pointer object-contain"
          playsInline
        />
      )}

      {/* Centered Play/Pause visual animation overlay */}
      {!isEmbed && showIndicator && (
        <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
          <div className="p-4 rounded-full bg-black/70 text-white backdrop-blur-md border border-white/10 animate-ping">
            {showIndicator === 'play' ? (
              <Play className="w-6 h-6 fill-current text-[#00b4d8] ml-0.5" />
            ) : (
              <Pause className="w-6 h-6 fill-current text-[#00b4d8]" />
            )}
          </div>
        </div>
      )}

      {/* Custom Control Overlay (Fades out when cursor idle) */}
      <div 
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 via-black/75 to-transparent p-4 md:p-6 flex flex-col gap-3 transition-opacity duration-500 z-10 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center gap-4">
            {/* Play/Pause toggle */}
            {!isEmbed && (
              <button 
                onClick={togglePlay} 
                className="w-8 h-8 rounded-lg bg-[#00b4d8] hover:bg-[#00b4d8]/80 text-[#090b10] flex items-center justify-center transition-all shadow-lg active:scale-95"
                title={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
              </button>
            )}

            {/* Mute and Volume controls */}
            {!isEmbed && (
              <div className="flex items-center gap-2">
                <button 
                  onClick={toggleMute} 
                  className="w-8 h-8 rounded-lg border border-white/5 bg-white/5 text-slate-300 hover:text-white flex items-center justify-center transition-all"
                  title={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-500" /> : <Volume2 className="w-3.5 h-3.5" />}
                </button>
                <input 
                  type="range" 
                  min="0" 
                  max="1" 
                  step="0.05" 
                  value={isMuted ? 0 : volume} 
                  onChange={handleVolume}
                  className="w-16 md:w-20 h-1 accent-[#00b4d8] rounded-lg cursor-pointer bg-slate-800"
                />
              </div>
            )}

            {/* Manual refresh button */}
            {!isEmbed && (
              <button
                onClick={handleManualRefresh}
                className="w-8 h-8 rounded-lg border border-white/5 bg-white/5 text-slate-300 hover:text-white flex items-center justify-center transition-all"
                title="Reload Stream Source"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Pulsing Live indicator */}
            <span className="px-2.5 py-0.5 rounded bg-rose-600/10 border border-rose-500/20 text-rose-500 text-[9px] font-black uppercase flex items-center gap-1.5 live-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span> Live
            </span>

            {/* Picture-in-Picture toggle button */}
            {!isEmbed && (
              <button 
                onClick={togglePictureInPicture}
                className="w-8 h-8 rounded-lg border border-white/5 bg-white/5 text-slate-300 hover:text-white flex items-center justify-center transition-all active:scale-95"
                title="Picture-in-Picture (P)"
              >
                <Tv className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Fullscreen toggle button */}
            <button 
              onClick={toggleFullscreen}
              className="w-8 h-8 rounded-lg border border-white/5 bg-white/5 text-slate-300 hover:text-white flex items-center justify-center transition-all active:scale-95"
              title="Toggle Fullscreen (F)"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
