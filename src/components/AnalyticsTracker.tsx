'use client';

import { useEffect } from 'react';

interface AnalyticsTrackerProps {
  activeChannelName?: string;
}

export default function AnalyticsTracker({ activeChannelName }: AnalyticsTrackerProps) {
  useEffect(() => {
    // Generate constant persistent context dynamic identifier strings metrics token
    let sessionKey = localStorage.getItem('tv_session_uuid');
    if (!sessionKey) {
      sessionKey = 'sess_' + Math.random().toString(36).substring(2, 11);
      localStorage.setItem('tv_session_uuid', sessionKey);
    }

    // Dynamic resolution of the active user profile tracking node parameters
    const saved = localStorage.getItem('active_auth_profile');
    let profile = { username: 'Guest Account User', userId: 'guest_' + Math.random().toString(36).substring(2, 10) };
    
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.username) {
          profile = {
            username: parsed.username,
            userId: parsed.id || 'usr_' + parsed.username.toLowerCase()
          };
        }
      } catch (e) {
        console.error('Failed parsing active user session profile:', e);
      }
    }

    const userData = {
      userId: profile.userId,
      username: profile.username,
      sessionId: sessionKey
    };

    // Fire log tracking event target validation on load selection channel change
    if (activeChannelName) {
      fetch('/api/admin/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'view_channel', channelName: activeChannelName, ...userData })
      });
    }

    // Baseline Interval Trigger Heartbeat Ping parameters definition operations
    const interval = setInterval(() => {
      fetch('/api/admin/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'heartbeat', channelName: activeChannelName || 'Directory Grid View', ...userData })
      });
    }, 15000); // Pulse checking frequency parameter map: 15 seconds iteration matrix sequence

    return () => clearInterval(interval);
  }, [activeChannelName]);

  return null;
}
