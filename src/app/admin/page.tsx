'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Activity, Tv, Database, Terminal, Users, Trash2, Plus, Sparkles } from 'lucide-react';
import SafeImage from '../../components/SafeImage';

interface IPTVChannel {
  id?: string;
  name: string;
  logo: string;
  category: string;
  urls: string[];
}

interface NewChannelState {
  name: string;
  logo: string;
  category: string;
  url: string;
}

interface ActiveSession {
  userId: string;
  username: string;
  currentChannel: string;
  lastPing: number;
}

interface LogEntry {
  timestamp: string;
  event: string;
}

interface AnalyticsData {
  concurrentUsers: number;
  activeSessions: ActiveSession[];
  channelViews: Record<string, number>;
  logs: LogEntry[];
}

export default function PlatformControlMatrixHub() {
  const router = useRouter();
  // Authentication states
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [passkeyInput, setPasskeyInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'analytics' | 'channels'>('analytics');

  // Channel States
  const [channels, setChannels] = useState<IPTVChannel[]>([]);
  const [formData, setFormData] = useState<NewChannelState>({ name: '', logo: '', category: '', url: '' });
  const [channelsLoading, setChannelsLoading] = useState(true);

  // Analytics States
  const [analytics, setAnalytics] = useState<AnalyticsData>({ concurrentUsers: 0, activeSessions: [], channelViews: {}, logs: [] });
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/admin/check-auth');
        if (res.ok) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
          router.push('/login');
        }
      } catch (err) {
        setIsAuthenticated(false);
        router.push('/login');
      }
    }
    checkAuth();
  }, [router]);

  useEffect(() => {
    if (isAuthenticated === true) {
      fetchChannels();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated !== true) return;
    
    async function getStats() {
      try {
        const res = await fetch('/api/admin/analytics');
        if (res.status === 401) {
          setIsAuthenticated(false);
          return;
        }
        const data = await res.json();
        setAnalytics(data);
      } catch (err) {
        console.error('Error fetching analytics:', err);
      } finally {
        setAnalyticsLoading(false);
      }
    }
    
    getStats();
    const livePollingIndex = setInterval(getStats, 10000); // 10s auto-refresh
    return () => clearInterval(livePollingIndex);
  }, [isAuthenticated]);

  async function fetchChannels() {
    try {
      const res = await fetch('/api/admin/channels');
      if (res.status === 401) {
        setIsAuthenticated(false);
        return;
      }
      const data = await res.json();
      if (Array.isArray(data)) {
        setChannels(data);
      }
    } catch (err) {
      console.error('Error fetching admin channels:', err);
    } finally {
      setChannelsLoading(false);
    }
  }

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout error:', err);
    }
    localStorage.removeItem('active_auth_profile');
    window.dispatchEvent(new Event('auth-change'));
    router.push('/login');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.url) {
      return alert('Name and URL processing parameters are mandatory.');
    }

    const channelPayload = {
      name: formData.name,
      logo: formData.logo || 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=150&auto=format&fit=crop',
      category: formData.category || 'General',
      urls: [formData.url]
    };

    try {
      const res = await fetch('/api/admin/channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(channelPayload)
      });

      if (res.status === 401) {
        setIsAuthenticated(false);
        return;
      }

      if (res.ok) {
        setFormData({ name: '', logo: '', category: '', url: '' });
        fetchChannels();
      }
    } catch (err) {
      console.error('Error submitting new channel:', err);
    }
  };

  const handleDelete = async (id?: string) => {
    if (!id) return;
    if (!confirm('Are you absolutely sure you want to drop this network channel node?')) return;
    
    try {
      const res = await fetch('/api/admin/channels', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });

      if (res.status === 401) {
        setIsAuthenticated(false);
        return;
      }

      if (res.ok) {
        fetchChannels();
      }
    } catch (err) {
      console.error('Error purging channel:', err);
    }
  };

  const isGlobalLoading = analyticsLoading && channelsLoading;

  if (isAuthenticated === null) {
    return (
      <div className="h-screen bg-[#06080f] text-[#00b4d8] font-mono flex flex-col gap-4 items-center justify-center tracking-widest text-xs animate-pulse">
        <div className="w-12 h-12 rounded-full border-4 border-[#00b4d8]/20 border-t-[#00b4d8] animate-spin" />
        <span>VERIFYING SYSTEM SECURITY SIGNATURES...</span>
      </div>
    );
  }

  if (isAuthenticated === false) {
    return (
      <div className="h-screen bg-[#06080f] text-[#00b4d8] font-mono flex flex-col gap-4 items-center justify-center tracking-widest text-xs">
        <div className="w-12 h-12 rounded-full border-4 border-[#00b4d8]/20 border-t-[#00b4d8] animate-spin" />
        <span>UNAUTHORIZED ACCESS: REDIRECTING TO LOGIN...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070913] text-[#f8fafc] p-6 font-sans relative overflow-hidden">
      {/* Decorative Background Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#00b4d8]/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
        
        {/* Core Header */}
        <div className="border-b border-white/5 pb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#00b4d8] animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest text-[#00b4d8] bg-[#00b4d8]/10 px-2.5 py-0.5 rounded-full border border-[#00b4d8]/20">
                PRO EDITION
              </span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-widest uppercase mt-2">LiveTV Master Control Hub</h1>
            <p className="text-xs text-slate-500 mt-1">Live Concurrent Connections, Audits Tracker, & Ingestion Engine Console</p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex items-center gap-3 bg-[#111425] border border-white/5 rounded-2xl px-5 py-3 shadow-inner">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
              </span>
              <span className="font-mono text-xs text-slate-300">
                Concurrent Audience: <b className="text-white text-sm ml-1.5 font-extrabold">{analytics.concurrentUsers}</b> online
              </span>
            </div>
            <button 
              onClick={handleSignOut}
              className="bg-rose-500/10 hover:bg-rose-500/25 border border-rose-500/20 hover:border-rose-500/40 text-rose-400 font-extrabold text-xs px-5 py-3 rounded-2xl tracking-widest uppercase transition-all duration-300 cursor-pointer text-center"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Tab Selection Row */}
        <div className="flex gap-2 p-1 bg-[#111425]/60 border border-white/5 rounded-2xl max-w-md">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'analytics'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-indigo-600/10'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Activity className="w-4 h-4" />
            Live Analytics
          </button>
          <button
            onClick={() => setActiveTab('channels')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'channels'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-indigo-600/10'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Database className="w-4 h-4" />
            Manage Channels
          </button>
        </div>

        {/* TAB 1: Live Analytics & Activity Hub */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Channel Distribution Traffic */}
              <div className="bg-[#0f111e]/80 border border-white/5 rounded-3xl p-5 shadow-2xl flex flex-col h-[400px]">
                <div className="flex items-center gap-2 border-b border-white/5 pb-3 mb-4">
                  <Tv className="w-4 h-4 text-[#00b4d8]" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Channel Tuning Distribution
                  </h3>
                </div>
                <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin">
                  {Object.keys(analytics.channelViews).length > 0 ? (
                    Object.entries(analytics.channelViews).map(([channel, views], idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs bg-[#090b14] px-4 py-3 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
                        <span className="font-semibold text-slate-200 truncate max-w-[65%]">{channel}</span>
                        <span className="text-[10px] font-mono font-bold text-[#00b4d8] bg-[#00b4d8]/10 border border-[#00b4d8]/20 px-2.5 py-1 rounded-lg">
                          {views} views
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-600 text-center pt-24">
                      No active channel registration hits detected.
                    </p>
                  )}
                </div>
              </div>

              {/* Connected Sessions Registry */}
              <div className="bg-[#0f111e]/80 border border-white/5 rounded-3xl p-5 shadow-2xl flex flex-col h-[400px] lg:col-span-2">
                <div className="flex items-center gap-2 border-b border-white/5 pb-3 mb-4">
                  <Users className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Active Client Session Registry
                  </h3>
                </div>
                <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 scrollbar-thin">
                  {analytics.activeSessions.length > 0 ? (
                    analytics.activeSessions.map((session, index) => (
                      <div key={index} className="flex justify-between items-center gap-4 text-xs bg-[#090b14] p-3.5 rounded-2xl border border-white/5 hover:border-white/10 hover:bg-[#0c0f20] transition-all">
                        <div className="min-w-0">
                          <p className="font-extrabold text-slate-200 truncate text-sm">{session.username}</p>
                          <span className="text-[10px] text-slate-500 font-mono tracking-tighter block mt-0.5">
                            ID Signature: {session.userId}
                          </span>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <span className="px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-bold text-[10px] uppercase tracking-wider">
                            Tuned: {session.currentChannel}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-600 text-center pt-28">
                      No active background telemetry heartbeat pings detected.
                    </p>
                  )}
                </div>
              </div>

            </div>

            {/* Global Activity Logs Registry */}
            <div className="bg-[#0f111e]/80 border border-white/5 rounded-3xl p-5 shadow-2xl">
              <div className="flex items-center gap-2 border-b border-white/5 pb-3 mb-4">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Operations Audits Stream Terminal
                </h3>
              </div>
              <div className="bg-[#04060b] rounded-2xl p-4 h-64 overflow-y-auto font-mono text-xs text-emerald-400 space-y-2 border border-white/5 shadow-inner scrollbar-thin">
                {analytics.logs.length > 0 ? (
                  analytics.logs.map((log, id) => (
                    <div key={id} className="flex gap-3 items-start tracking-tight leading-relaxed opacity-90 border-b border-white/5 pb-2 last:border-0">
                      <span className="text-slate-600 flex-shrink-0">
                        [{log.timestamp.split('T')[1]?.slice(0, 8) || log.timestamp}]
                      </span>
                      <span className="text-emerald-500/60 flex-shrink-0">›</span>
                      <p className="text-slate-300 font-medium">{log.event}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-600 text-center pt-20">
                    Awaiting system runtime triggers...
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Channel Directory Controls */}
        {activeTab === 'channels' && (
          <div className="space-y-6">
            
            {/* Input Ingestion Frame */}
            <div className="bg-[#0f111e]/80 border border-white/5 p-6 rounded-3xl shadow-xl relative overflow-hidden">
              <div className="flex items-center gap-2 mb-4">
                <Plus className="w-4 h-4 text-indigo-400" />
                <h2 className="text-xs font-bold text-slate-300 uppercase tracking-widest">
                  Ingest Dynamic Network Stream Node
                </h2>
              </div>
              
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Channel Title</label>
                  <input 
                    type="text" placeholder="e.g. FIFA TV Live" value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="bg-[#090b14] border border-white/5 rounded-2xl px-4 py-3.5 text-white focus:outline-none focus:border-indigo-500 hover:border-white/10 transition-colors font-medium text-xs"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Category Scope</label>
                  <input 
                    type="text" placeholder="e.g. Sports, Entertainment" value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value})}
                    className="bg-[#090b14] border border-white/5 rounded-2xl px-4 py-3.5 text-white focus:outline-none focus:border-indigo-500 hover:border-white/10 transition-colors font-medium text-xs"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Logo URL</label>
                  <input 
                    type="text" placeholder="https://..." value={formData.logo}
                    onChange={e => setFormData({...formData, logo: e.target.value})}
                    className="bg-[#090b14] border border-white/5 rounded-2xl px-4 py-3.5 text-white focus:outline-none focus:border-indigo-500 hover:border-white/10 transition-colors font-medium text-xs"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Direct Stream URL (M3U8)</label>
                  <input 
                    type="text" placeholder="https://.../index.m3u8" value={formData.url}
                    onChange={e => setFormData({...formData, url: e.target.value})}
                    className="bg-[#090b14] border border-white/5 rounded-2xl px-4 py-3.5 text-white focus:outline-none focus:border-indigo-500 hover:border-white/10 transition-colors font-medium text-xs"
                  />
                </div>
                
                <button type="submit" className="md:col-span-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-extrabold text-xs py-4 rounded-2xl hover:opacity-95 transition-all shadow-xl shadow-indigo-600/10 uppercase tracking-widest mt-2 flex items-center justify-center gap-2 cursor-pointer">
                  ⚡ Add Custom Stream Node
                </button>
              </form>
            </div>

            {/* Database Records Table */}
            <div className="bg-[#0f111e]/80 border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
              <div className="p-5 bg-[#090b14]/50 border-b border-white/5 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-[#00b4d8]" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Database Directory Records Matrix
                  </h3>
                </div>
                <span className="text-[10px] font-mono font-bold bg-[#00b4d8]/10 text-[#00b4d8] px-3 py-1 rounded-full border border-[#00b4d8]/20">
                  {channels.length} Nodes Configured
                </span>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#090b14]/40 text-slate-400 font-bold border-b border-white/5 uppercase tracking-wider">
                      <th className="p-5">Visual Node</th>
                      <th className="p-5">Category Scope</th>
                      <th className="p-5">Data Stream URL Reference</th>
                      <th className="p-5 text-right">Overrides</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {channels.length > 0 ? (
                      channels.map((ch) => (
                        <tr key={ch.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="p-5 flex items-center gap-3">
                            <div className="w-9 h-9 bg-white rounded-xl p-1 border border-white/5 relative overflow-hidden flex-shrink-0">
                              <SafeImage 
                                src={ch.logo} 
                                alt="" 
                                fill
                                sizes="36px"
                                className="object-contain p-1"
                              />
                            </div>
                            <span className="font-extrabold text-white max-w-[200px] truncate">{ch.name}</span>
                          </td>
                          <td className="p-5">
                            <span className="px-2.5 py-1 bg-[#090b14] border border-white/5 rounded-xl font-bold text-[10px] text-slate-400 uppercase tracking-wider">
                              {ch.category}
                            </span>
                          </td>
                          <td className="p-5 font-mono text-[10px] text-slate-500 truncate max-w-[260px]">
                            {ch.urls?.[0]}
                          </td>
                          <td className="p-5 text-right">
                            <button 
                              onClick={() => handleDelete(ch.id)}
                              className="text-[10px] bg-rose-600/10 text-rose-500 border border-rose-500/20 px-3.5 py-2 rounded-xl hover:bg-rose-600 hover:text-white transition-all font-bold tracking-wider flex items-center gap-1.5 ml-auto cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              PURGE NODE
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-slate-500 font-medium">
                          No custom stream channels registered inside database.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
