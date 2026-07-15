'use client';

import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';

interface LivePlayerSimpleProps {
  urls?: string[];
}

export default function LivePlayerSimple({ urls = [] }: LivePlayerSimpleProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [urlIndex, setUrlIndex] = useState(0);
  const [playerError, setPlayerError] = useState('');

  // Reset stream index when urls list changes
  useEffect(() => {
    setUrlIndex(0);
    setPlayerError('');
  }, [urls]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !urls || urls.length === 0) return;

    let currentStream = urls[urlIndex];
    if (currentStream && currentStream.startsWith('http://')) {
      currentStream = `/api/stream?url=${encodeURIComponent(currentStream)}`;
    }
    let hls: Hls | null = null;

    const handleFallback = () => {
      if (urlIndex < urls.length - 1) {
        setPlayerError(`Primary link down. Switching to backup source ${urlIndex + 2}...`);
        setTimeout(() => {
          setUrlIndex((prev) => prev + 1);
          setPlayerError('');
        }, 2000); // 2-second delay buffer
      } else {
        setPlayerError('All available streaming streams are offline right now.');
      }
    };

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = currentStream;
      video.onerror = () => handleFallback();
    } 
    else if (Hls.isSupported()) {
      hls = new Hls({ 
        maxMaxBufferLength: 10, 
        manifestLoadingMaxRetry: 2 
      });
      hls.loadSource(currentStream);
      hls.attachMedia(video);

      hls.on(Hls.Events.ERROR, function (event, data) {
        if (data.fatal) {
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
            console.log("Network error caught, initializing fallback...");
            handleFallback();
          } else {
            hls?.recoverMediaError();
          }
        }
      });
    }

    return () => {
      if (hls) hls.destroy();
    };
  }, [urls, urlIndex]);

  return (
    <div className="w-full aspect-video bg-black rounded-lg overflow-hidden shadow-lg relative">
      {playerError && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-4 text-center z-10 text-yellow-400 font-medium text-sm">
          {playerError}
        </div>
      )}
      <video
        ref={videoRef}
        controls
        autoPlay
        muted
        className="w-full h-full object-contain"
      />
    </div>
  );
}
