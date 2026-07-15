"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X, LogOut, Shield, LogIn, Search, Bell, ChevronDown, User } from 'lucide-react';
import { siteConfig } from '../config';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<{ username: string; role: string } | null>(null);
  
  // Navigation states
  const [activeTab, setActiveTab] = useState<'home' | 'channels' | 'upcoming' | 'search'>('home');
  
  // UI interaction states
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [searchVal, setSearchVal] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  
  // Refs for closing dropdowns on click outside
  const notificationsRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Mock Notifications Data
  const notifications = [
    { id: 1, title: "🏆 Match Starting Soon!", desc: "Argentina vs France kicks off in 15 minutes.", time: "5m ago", unread: true },
    { id: 2, title: "📺 New Stream Source", desc: "Backup stable stream added for Channel 3.", time: "1h ago", unread: false },
    { id: 3, title: "🔥 Live Broadcast", desc: "FIFA World Cup Daily Highlights is now live.", time: "3h ago", unread: false }
  ];

  // Sync Auth profile
  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem('active_auth_profile');
      if (saved) {
        try {
          setUserProfile(JSON.parse(saved));
        } catch (e) {
          setUserProfile(null);
        }
      } else {
        setUserProfile(null);
      }
    };

    handleStorageChange();
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('auth-change', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('auth-change', handleStorageChange);
    };
  }, []);

  // Sync Active Tab with url parameters on page load and custom events
  useEffect(() => {
    // 1. Initial load sync
    if (pathname === '/') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      if (tab && ['home', 'channels', 'upcoming', 'search'].includes(tab)) {
        setActiveTab(tab as any);
        if (tab === 'search') {
          setIsSearchExpanded(true);
          const q = params.get('q');
          if (q) setSearchVal(q);
        }
      }
    } else {
      setActiveTab('home'); // default on other pages
    }

    // 2. Custom event sync (from BottomNav or other components)
    const handleTabChange = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      setActiveTab(customEvent.detail as any);
      if (customEvent.detail !== 'search') {
        setIsSearchExpanded(false);
        setSearchVal('');
      }
    };

    window.addEventListener('tab-change', handleTabChange);
    return () => {
      window.removeEventListener('tab-change', handleTabChange);
    };
  }, [pathname]);

  // Click outside listener for dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfileDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      console.error('Logout request failed:', e);
    }
    localStorage.removeItem('active_auth_profile');
    setUserProfile(null);
    window.dispatchEvent(new Event('auth-change'));
    setShowProfileDropdown(false);
    router.push('/login');
  };

  // Switch navigation tabs
  const navigateToTab = (tabId: 'home' | 'channels' | 'upcoming' | 'search') => {
    setActiveTab(tabId);
    setIsOpen(false);
    if (pathname === '/') {
      window.dispatchEvent(new CustomEvent('tab-change', { detail: tabId }));
      // Update URL search parameters without full page reload
      const newUrl = tabId === 'home' ? '/' : `/?tab=${tabId}`;
      window.history.pushState({}, '', newUrl);
    } else {
      router.push(`/?tab=${tabId}`);
    }
  };

  // Handle Search Input Change
  const handleSearchChange = (val: string) => {
    setSearchVal(val);
    if (pathname === '/') {
      window.dispatchEvent(new CustomEvent('search-query', { detail: val }));
      // Ensure tab is set to search
      if (activeTab !== 'search') {
        setActiveTab('search');
        window.dispatchEvent(new CustomEvent('tab-change', { detail: 'search' }));
      }
      window.history.pushState({}, '', `/?tab=search&q=${encodeURIComponent(val)}`);
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (pathname !== '/') {
        router.push(`/?tab=search&q=${encodeURIComponent(searchVal)}`);
      }
      searchInputRef.current?.blur();
    }
  };

  const clearSearch = () => {
    setSearchVal('');
    if (pathname === '/') {
      window.dispatchEvent(new CustomEvent('search-query', { detail: '' }));
      navigateToTab('home');
    }
    setIsSearchExpanded(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full transition-all duration-300 backdrop-blur-md bg-[#0b0c10]/70 border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
        
        {/* Left Side: Brand Logo */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 group shrink-0">
            <span className="text-xl md:text-2xl font-black tracking-wider bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 bg-clip-text text-transparent group-hover:opacity-90 transition-opacity">
              LIVE TV
            </span>
            <div className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400 shadow-[0_0_8px_#22d3ee]"></span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-2">
            {[
              { id: 'home', label: 'Home' },
              { id: 'channels', label: 'Channels' },
              { id: 'upcoming', label: 'Upcoming' },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => navigateToTab(tab.id as any)}
                  className={`relative text-xs md:text-sm font-bold uppercase tracking-wider px-4 py-2 rounded-full transition-all duration-300 cursor-pointer ${
                    isActive
                      ? 'bg-white/10 text-cyan-400 border border-white/5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right Side: Search & User Actions */}
        <div className="flex items-center gap-4">
          
          {/* Expandable Glassmorphic Search Bar */}
          <div className="relative flex items-center">
            <div 
              className={`flex items-center transition-all duration-300 rounded-full border ${
                isSearchExpanded 
                  ? 'w-48 md:w-64 bg-white/10 border-white/20 px-3' 
                  : 'w-10 h-10 bg-transparent border-transparent justify-center hover:bg-white/5 hover:border-white/5'
              }`}
            >
              <button 
                onClick={() => {
                  setIsSearchExpanded(!isSearchExpanded);
                  if (!isSearchExpanded) {
                    setTimeout(() => searchInputRef.current?.focus(), 100);
                  }
                }}
                className="text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Search Channels"
              >
                <Search className="w-4 h-4 shrink-0" />
              </button>
              
              <input
                ref={searchInputRef}
                type="text"
                value={searchVal}
                onChange={(e) => handleSearchChange(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Search live streams..."
                className={`bg-transparent text-white text-xs font-semibold placeholder:text-slate-500 focus:outline-none transition-all duration-300 ${
                  isSearchExpanded ? 'w-full ml-2 opacity-100' : 'w-0 opacity-0 pointer-events-none'
                }`}
              />

              {isSearchExpanded && searchVal && (
                <button 
                  onClick={clearSearch}
                  className="text-slate-500 hover:text-white transition-colors shrink-0 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Notification Bell Dropdown */}
          <div className="relative" ref={notificationsRef}>
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 text-slate-300 hover:text-white transition-all duration-300 relative cursor-pointer active:scale-95"
            >
              <Bell className="w-4 h-4 hover:rotate-12 transition-transform duration-300" />
              {notifications.some(n => n.unread) && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-rose-500 border-2 border-[#0b0c10] shadow-[0_0_6px_#f43f5e]"></span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-3 w-80 rounded-2xl glass-panel border border-white/10 p-4 shadow-2xl z-50 animate-in fade-in slide-in-from-top-3 duration-200">
                <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-300">Live Notifications</h4>
                  <span className="text-[10px] font-bold text-cyan-400 cursor-pointer hover:underline">Mark all read</span>
                </div>
                <div className="space-y-2.5 max-h-60 overflow-y-auto">
                  {notifications.map((item) => (
                    <div 
                      key={item.id} 
                      className={`p-2.5 rounded-xl border transition-all hover:bg-white/5 ${
                        item.unread ? 'bg-cyan-500/5 border-cyan-500/10' : 'bg-transparent border-transparent'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-bold text-white tracking-wide leading-snug">{item.title}</span>
                        <span className="text-[9px] text-slate-500 font-semibold shrink-0 mt-0.5">{item.time}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Profile Dropdown */}
          <div className="relative" ref={profileRef}>
            <button 
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              className="flex items-center gap-1.5 p-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 transition-all duration-300 cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#00b4d8] to-indigo-600 flex items-center justify-center text-white font-extrabold text-xs shadow-inner">
                {userProfile ? userProfile.username.substring(0, 2).toUpperCase() : <User className="w-4 h-4 text-white" />}
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showProfileDropdown && (
              <div className="absolute right-0 mt-3 w-56 rounded-2xl glass-panel border border-white/10 p-2 shadow-2xl z-50 animate-in fade-in slide-in-from-top-3 duration-200">
                {userProfile ? (
                  <>
                    <div className="px-3.5 py-3 border-b border-white/5 mb-1 text-left">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Signed in as</p>
                      <p className="text-sm font-black text-white truncate mt-0.5">{userProfile.username}</p>
                      <span className="inline-block text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 mt-1.5 border border-cyan-500/15">
                        {userProfile.role}
                      </span>
                    </div>

                    {userProfile.role === 'admin' && (
                      <Link 
                        href="/admin"
                        onClick={() => setShowProfileDropdown(false)}
                        className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
                      >
                        <Shield className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Admin Dashboard</span>
                      </Link>
                    )}

                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold text-rose-400 hover:text-white hover:bg-rose-500/10 border border-transparent hover:border-rose-500/15 transition-all text-left cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </>
                ) : (
                  <>
                    <div className="px-3.5 py-3 text-left">
                      <p className="text-sm font-bold text-white leading-tight">Welcome to LIVE TV</p>
                      <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">Sign in to sync your bookmarks & channels.</p>
                    </div>
                    <Link 
                      href="/login"
                      onClick={() => setShowProfileDropdown(false)}
                      className="flex items-center gap-2 m-1.5 px-3.5 py-2.5 rounded-xl text-xs font-black tracking-widest text-[#090b10] bg-cyan-400 hover:bg-cyan-300 shadow-md shadow-cyan-400/15 uppercase text-center justify-center transition-all"
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      <span>Sign In</span>
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Mobile Hamburg Toggle Button */}
          <div className="md:hidden">
            <button 
              onClick={() => setIsOpen(!isOpen)} 
              className="p-2 text-slate-300 hover:text-white rounded-full bg-white/5 border border-white/5 cursor-pointer active:scale-95 transition-all"
            >
              {isOpen ? <X className="w-5 h-5 animate-in spin-in-12 duration-200" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div className="absolute top-16 left-0 w-full bg-[#0b0c10]/95 backdrop-blur-lg border-b border-white/10 shadow-2xl p-6 flex flex-col gap-6 md:hidden animate-in fade-in slide-in-from-top-3 duration-250">
          
          {/* Navigation Links */}
          <div className="flex flex-col gap-3">
            {[
              { id: 'home', label: 'Home' },
              { id: 'channels', label: 'Channels' },
              { id: 'upcoming', label: 'Upcoming' },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => navigateToTab(tab.id as any)}
                  className={`w-full text-center py-3 rounded-2xl text-sm font-bold uppercase tracking-wider transition-all ${
                    isActive
                      ? 'bg-cyan-400/10 text-cyan-400 border border-cyan-400/20'
                      : 'text-slate-300 hover:text-white hover:bg-white/5 border border-transparent'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="h-px bg-white/10 w-full"></div>

          {/* Actions Section */}
          <div className="flex flex-col gap-3">
            {userProfile ? (
              <>
                <div className="px-2 text-center">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Signed in as</p>
                  <p className="text-sm font-black text-white mt-0.5">{userProfile.username}</p>
                </div>
                {userProfile.role === 'admin' && (
                  <Link 
                    href="/admin"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-center gap-2 text-xs font-black tracking-widest text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 py-3.5 rounded-2xl uppercase"
                  >
                    <Shield className="w-4 h-4" />
                    <span>Admin Panel</span>
                  </Link>
                )}
                <button 
                  onClick={() => {
                    setIsOpen(false);
                    handleSignOut();
                  }}
                  className="flex items-center justify-center gap-2 text-xs font-black tracking-widest text-rose-400 bg-rose-500/10 border border-rose-500/20 py-3.5 rounded-2xl uppercase cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </>
            ) : (
              <Link 
                href="/login"
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-center gap-2 text-xs font-black tracking-widest text-[#090b10] bg-cyan-400 hover:bg-cyan-300 py-3.5 rounded-2xl uppercase shadow-md shadow-cyan-400/15"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In</span>
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
