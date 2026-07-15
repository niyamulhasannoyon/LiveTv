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

  // Autocomplete Suggestions States
  const [suggestions, setSuggestions] = useState<IPTVChannel[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

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
      fetchSuggestions();
    }
  }, [isAuthenticated]);

  async function fetchSuggestions() {
    try {
      const res = await fetch('/api/channels');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setSuggestions(data);
        }
      }
    } catch (err) {
      console.error('Error fetching suggestions:', err);
    }
  }

  const handleSelectSuggestion = (ch: IPTVChannel) => {
    setFormData({
      name: ch.name,
      logo: ch.logo || '',
      category: ch.category || '',
      url: ch.urls?.[0] || ''
    });
    setShowSuggestions(false);
  };

  const filteredSuggestions = formData.name.trim()
    ? suggestions.filter(ch => 
        ch.name.toLowerCase().includes(formData.name.toLowerCase()) &&
        ch.name.toLowerCase() !== formData.name.toLowerCase()
      ).slice(0, 5)
    : [];

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
    <div className="min-h-screen bg-[#090b10] text-[#f8fafc] p-6 font-sans relative overflow-hidden pb-16">
      {/* Radiant Glow Lights */}
      <div className="absolute top-[5%] left-[10%] w-[350px] h-[350px] rounded-full bg-blue-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[10%] right-[5%] w-[450px] h-[450px] rounded-full bg-indigo-500/10 blur-[150px] pointer-events-none" />
      <div className="absolute top-[40%] right-[25%] w-[300px] h-[300px] rounded-full bg-[#00b4d8]/5 blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
        
        {/* Core Header */}
        <div className="border-b border-white/5 pb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#00b4d8] animate-pulse" />
              <span className="text-[9px] font-black uppercase tracking-widest text-[#00b4d8] bg-[#00b4d8]/10 px-2.5 py-0.5 rounded-full border border-[#00b4d8]/20">
                PRO EDITION
              </span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-wider uppercase bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">LiveTV Master Control Hub</h1>
            <p className="text-xs text-slate-500 font-medium">Live Concurrent Connections, Audits Tracker, & Ingestion Engine Console</p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex items-center gap-3 bg-[#141821]/80 backdrop-blur-md border border-white/5 rounded-2xl px-5 py-3 shadow-inner">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
              </span>
              <span className="font-mono text-xs text-slate-300 font-bold uppercase tracking-wider">
                Audience: <b className="text-white text-sm ml-1.5 font-extrabold">{analytics.concurrentUsers}</b> online
              </span>
            </div>
            <button 
              onClick={handleSignOut}
              className="bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 hover:border-rose-500/30 text-rose-400 font-extrabold text-xs px-5 py-3 rounded-2xl tracking-widest uppercase transition-all duration-300 cursor-pointer text-center"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Tab Selection Row */}
        <div className="flex gap-2 p-1.5 bg-[#141821]/60 border border-white/5 rounded-2xl max-w-sm backdrop-blur-md">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              activeTab === 'analytics'
                ? 'bg-gradient-to-r from-[#00b4d8] to-indigo-600 text-white shadow-md shadow-[#00b4d8]/10'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Activity className="w-4 h-4" />
            Analytics
          </button>
          <button
            onClick={() => setActiveTab('channels')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              activeTab === 'channels'
                ? 'bg-gradient-to-r from-[#00b4d8] to-indigo-600 text-white shadow-md shadow-[#00b4d8]/10'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Database className="w-4 h-4" />
            Channels
          </button>
        </div>

        {/* TAB 1: Live Analytics & Activity Hub */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Channel Distribution Traffic */}
              <div className="bg-[#141821]/50 backdrop-blur-md border border-white/5 rounded-3xl p-5 shadow-2xl flex flex-col h-[400px]">
                <div className="flex items-center gap-2 border-b border-white/5 pb-3 mb-4">
                  <Tv className="w-4 h-4 text-[#00b4d8]" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-300">
                    Channel Tuning Traffic
                  </h3>
                </div>
                <div className="flex-grow overflow-y-auto space-y-2 pr-1 no-scrollbar">
                  {Object.keys(analytics.channelViews).length > 0 ? (
                    Object.entries(analytics.channelViews).map(([channel, views], idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs bg-[#090b10]/40 px-4 py-3.5 rounded-2xl border border-white/5 hover:border-[#00b4d8]/20 transition-all">
                        <span className="font-bold text-slate-200 truncate max-w-[65%] tracking-wide">{channel}</span>
                        <span className="text-[10px] font-mono font-bold text-[#00b4d8] bg-[#00b4d8]/10 border border-[#00b4d8]/20 px-2.5 py-1 rounded-lg">
                          {views} views
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-600 text-center pt-24 font-bold uppercase tracking-wider">
                      No Tuning Activity Detected.
                    </p>
                  )}
                </div>
              </div>

              {/* Connected Sessions Registry */}
              <div className="bg-[#141821]/50 backdrop-blur-md border border-white/5 rounded-3xl p-5 shadow-2xl flex flex-col h-[400px] lg:col-span-2">
                <div className="flex items-center gap-2 border-b border-white/5 pb-3 mb-4">
                  <Users className="w-4 h-4 text-[#00b4d8]" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-300">
                    Active Client Session Registry
                  </h3>
                </div>
                <div className="flex-grow overflow-y-auto space-y-2.5 pr-1 no-scrollbar">
                  {analytics.activeSessions.length > 0 ? (
                    analytics.activeSessions.map((session, index) => (
                      <div key={index} className="flex justify-between items-center gap-4 text-xs bg-[#090b10]/40 p-4 rounded-2xl border border-white/5 hover:bg-[#141821] hover:border-white/10 transition-all">
                        <div className="min-w-0">
                          <p className="font-extrabold text-slate-200 truncate text-sm tracking-wide">{session.username}</p>
                          <span className="text-[9px] text-slate-500 font-mono tracking-wider block mt-1">
                            ID: {session.userId}
                          </span>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <span className="px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-black text-[9px] uppercase tracking-widest">
                            Tuned: {session.currentChannel}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-600 text-center pt-28 font-bold uppercase tracking-wider">
                      No Active Telemetry heartbeats.
                    </p>
                  )}
                </div>
              </div>

            </div>

            {/* Global Activity Logs Registry */}
            <div className="bg-[#141821]/50 backdrop-blur-md border border-white/5 rounded-3xl p-5 shadow-2xl">
              <div className="flex items-center gap-2 border-b border-white/5 pb-3 mb-4">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-300">
                  Operations Audits Stream Terminal
                </h3>
              </div>
              <div className="bg-[#090b10] rounded-2xl p-4 h-64 overflow-y-auto font-mono text-[11px] text-emerald-400 space-y-2 border border-white/5 shadow-inner no-scrollbar">
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
            <div className="bg-[#141821]/50 backdrop-blur-md border border-white/5 p-6 rounded-3xl shadow-xl relative overflow-hidden">
              <div className="flex items-center gap-2 mb-4">
                <Plus className="w-4 h-4 text-[#00b4d8]" />
                <h2 className="text-xs font-black text-slate-300 uppercase tracking-widest">
                  Ingest Dynamic Network Stream Node
                </h2>
              </div>
              
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                
                {/* Channel Title (Autocomplete Input) */}
                <div className="flex flex-col gap-1.5 relative">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Channel Title</label>
                  <input 
                    type="text" placeholder="e.g. FIFA TV Live" value={formData.name}
                    onChange={e => {
                      setFormData({...formData, name: e.target.value});
                      setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    className="bg-[#090b14]/80 border border-white/5 rounded-2xl px-4 py-3.5 text-white focus:outline-none focus:border-[#00b4d8] focus:ring-1 focus:ring-[#00b4d8]/30 transition-all font-medium text-xs shadow-inner placeholder:text-slate-600"
                  />
                  {showSuggestions && filteredSuggestions.length > 0 && (
                    <div className="absolute top-[100%] left-0 right-0 z-50 mt-1 bg-[#141821]/95 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-md overflow-hidden divide-y divide-white/5 max-h-56 overflow-y-auto">
                      {filteredSuggestions.map((ch, idx) => (
                        <div
                          key={idx}
                          onClick={() => handleSelectSuggestion(ch)}
                          className="px-4 py-3 hover:bg-[#00b4d8]/10 text-white hover:text-[#00b4d8] cursor-pointer flex items-center justify-between transition-colors font-medium text-xs"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-6 h-6 rounded-md overflow-hidden bg-white flex items-center justify-center p-0.5 relative shrink-0">
                              <img src={ch.logo} alt="" className="w-full h-full object-contain" />
                            </div>
                            <span className="truncate text-slate-200 font-bold">{ch.name}</span>
                          </div>
                          <span className="text-[9px] bg-[#00b4d8]/10 text-[#00b4d8] border border-[#00b4d8]/20 px-2 py-0.5 rounded-md uppercase tracking-wider font-bold shrink-0">
                            {ch.category}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Category Scope</label>
                  <input 
                    type="text" placeholder="e.g. Sports, Entertainment" value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value})}
                    className="bg-[#090b14]/80 border border-white/5 rounded-2xl px-4 py-3.5 text-white focus:outline-none focus:border-[#00b4d8] focus:ring-1 focus:ring-[#00b4d8]/30 transition-all font-medium text-xs shadow-inner placeholder:text-slate-600"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Logo URL</label>
                  <input 
                    type="text" placeholder="https://..." value={formData.logo}
                    onChange={e => setFormData({...formData, logo: e.target.value})}
                    className="bg-[#090b14]/80 border border-white/5 rounded-2xl px-4 py-3.5 text-white focus:outline-none focus:border-[#00b4d8] focus:ring-1 focus:ring-[#00b4d8]/30 transition-all font-medium text-xs shadow-inner placeholder:text-slate-600"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Direct Stream URL (M3U8)</label>
                  <input 
                    type="text" placeholder="https://.../index.m3u8" value={formData.url}
                    onChange={e => setFormData({...formData, url: e.target.value})}
                    className="bg-[#090b14]/80 border border-white/5 rounded-2xl px-4 py-3.5 text-white focus:outline-none focus:border-[#00b4d8] focus:ring-1 focus:ring-[#00b4d8]/30 transition-all font-medium text-xs shadow-inner placeholder:text-slate-600"
                  />
                </div>
                
                <button type="submit" className="md:col-span-2 bg-gradient-to-r from-[#00b4d8] to-indigo-600 text-white font-extrabold text-xs py-4 rounded-2xl hover:opacity-95 shadow-lg shadow-[#00b4d8]/10 hover:shadow-[#00b4d8]/20 transition-all uppercase tracking-widest mt-2 flex items-center justify-center gap-2 cursor-pointer">
                  ⚡ Add Custom Stream Node
                </button>
              </form>
            </div>

            {/* Database Records Table */}
            <div className="bg-[#141821]/50 backdrop-blur-md border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
              <div className="p-5 bg-[#090b14]/40 border-b border-white/5 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-[#00b4d8]" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-300">
                    Database Directory Records Matrix
                  </h3>
                </div>
                <span className="text-[9px] font-mono font-bold bg-[#00b4d8]/10 text-[#00b4d8] px-3.5 py-1 rounded-full border border-[#00b4d8]/20 tracking-wider">
                  {channels.length} Nodes Configured
                </span>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#090b14]/60 text-slate-400 font-bold border-b border-white/5 uppercase tracking-wider text-[10px]">
                      <th className="p-5">Visual Node</th>
                      <th className="p-5">Category Scope</th>
                      <th className="p-5">Data Stream URL Reference</th>
                      <th className="p-5 text-right">Overrides</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {channels.length > 0 ? (
                      channels.map((ch) => (
                        <tr key={ch.id} className="hover:bg-white/[0.02] transition-all">
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
                            <span className="font-extrabold text-slate-200 max-w-[200px] truncate tracking-wide">{ch.name}</span>
                          </td>
                          <td className="p-5">
                            <span className="px-2.5 py-1 bg-[#090b10]/80 border border-white/5 rounded-xl font-bold text-[9px] text-[#00b4d8] uppercase tracking-wider">
                              {ch.category}
                            </span>
                          </td>
                          <td className="p-5 font-mono text-[10px] text-slate-500 truncate max-w-[260px]">
                            {ch.urls?.[0]}
                          </td>
                          <td className="p-5 text-right">
                            <button 
                              onClick={() => handleDelete(ch.id)}
                              className="text-[9px] bg-rose-600/10 text-rose-500 border border-rose-500/20 px-3.5 py-2 rounded-xl hover:bg-rose-600 hover:text-white transition-all font-bold tracking-widest flex items-center gap-1.5 ml-auto cursor-pointer uppercase"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Purge
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-slate-500 font-bold uppercase tracking-wider">
                          No custom stream channels registered.
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
