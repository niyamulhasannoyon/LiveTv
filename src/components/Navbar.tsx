"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Trophy, Menu, X, LogOut, Shield, LogIn } from 'lucide-react';
import { siteConfig } from '../config';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<{ username: string; role: string } | null>(null);

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

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      console.error('Logout request failed:', e);
    }
    localStorage.removeItem('active_auth_profile');
    setUserProfile(null);
    window.dispatchEvent(new Event('auth-change'));
    window.location.href = '/login';
  };

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'About', href: '/about' },
    { name: 'Privacy', href: '/privacy' },
    { name: 'Terms', href: '/terms' },
    { name: 'Contact', href: '/contact' },
  ];

  return (
    <nav className="fixed w-full z-50 bg-[#090b10]/80 backdrop-blur-md border-b border-white/5 rounded-none px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Trophy className="text-yellow-500 w-7 h-7 filter drop-shadow-[0_0_8px_rgba(234,179,8,0.4)] animate-pulse" />
        <Link href="/" className="text-xl font-extrabold tracking-tight text-white hover:text-rose-400 transition-colors">
          {siteConfig.logoText}
        </Link>
      </div>

      {/* Desktop Navigation */}
      <div className="hidden md:flex items-center gap-8">
        <div className="flex items-center gap-8 border-r border-white/10 pr-8">
          {navLinks.map((link) => (
            <Link 
              key={link.name} 
              href={link.href}
              className="text-sm font-semibold text-slate-400 hover:text-white transition-colors"
            >
              {link.name}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-4">
          {userProfile ? (
            <>
              {userProfile.role === 'admin' && (
                <Link 
                  href="/admin"
                  className="flex items-center gap-2 text-xs font-black tracking-widest text-[#00b4d8] bg-[#00b4d8]/10 border border-[#00b4d8]/20 px-4 py-2 rounded-xl uppercase hover:bg-[#00b4d8]/25 transition-all"
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>Admin Panel</span>
                </Link>
              )}
              <button 
                onClick={handleSignOut}
                className="flex items-center gap-2 text-xs font-black tracking-widest text-rose-400 bg-rose-500/10 border border-rose-500/20 px-4 py-2 rounded-xl uppercase hover:bg-rose-500/25 transition-all cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </>
          ) : (
            <Link 
              href="/login"
              className="flex items-center gap-2 text-xs font-black tracking-widest text-white bg-gradient-to-r from-[#00b4d8] to-indigo-600 px-4 py-2 rounded-xl uppercase hover:opacity-95 shadow-md shadow-[#00b4d8]/10 transition-all"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </Link>
          )}
        </div>
      </div>

      {/* Mobile Menu Toggle */}
      <div className="md:hidden">
        <button onClick={() => setIsOpen(!isOpen)} className="text-slate-300 hover:text-white p-2">
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="absolute top-full left-0 w-full bg-[#090b10]/95 backdrop-blur-lg mt-0 py-6 flex flex-col items-center gap-5 md:hidden border-b border-white/10 shadow-2xl">
          {navLinks.map((link) => (
            <Link 
              key={link.name} 
              href={link.href}
              onClick={() => setIsOpen(false)}
              className="text-base font-semibold text-slate-300 hover:text-white w-full text-center py-2"
            >
              {link.name}
            </Link>
          ))}
          
          <div className="w-[80%] h-px bg-white/10 my-1"></div>

          <div className="flex flex-col items-center gap-4 w-[80%]">
            {userProfile ? (
              <>
                {userProfile.role === 'admin' && (
                  <Link 
                    href="/admin"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-center gap-2 text-xs font-black tracking-widest text-[#00b4d8] bg-[#00b4d8]/10 border border-[#00b4d8]/20 w-full py-3.5 rounded-xl uppercase"
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
                  className="flex items-center justify-center gap-2 text-xs font-black tracking-widest text-rose-400 bg-rose-500/10 border border-rose-500/20 w-full py-3.5 rounded-xl uppercase cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </>
            ) : (
              <Link 
                href="/login"
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-center gap-2 text-xs font-black tracking-widest text-white bg-gradient-to-r from-[#00b4d8] to-indigo-600 w-full py-3.5 rounded-xl uppercase shadow-md shadow-[#00b4d8]/10"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In</span>
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
