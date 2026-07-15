"use client";

import React from 'react';
import Link from 'next/link';
import { Trophy, Menu, X } from 'lucide-react';
import { siteConfig } from '../config';

export default function Navbar() {
  const [isOpen, setIsOpen] = React.useState(false);

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'About', href: '/about' },
    { name: 'Privacy', href: '/privacy' },
    { name: 'Terms', href: '/terms' },
    { name: 'Contact', href: '/contact' },
  ];

  return (
    <nav className="fixed w-full z-50 glass-panel border-b border-white/5 rounded-none px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Trophy className="text-yellow-500 w-7 h-7 filter drop-shadow-[0_0_8px_rgba(234,179,8,0.4)] animate-pulse" />
        <Link href="/" className="text-xl font-extrabold tracking-tight text-white hover:text-rose-400 transition-colors">
          {siteConfig.logoText}
        </Link>
      </div>


      {/* Desktop Navigation */}
      <div className="hidden md:flex items-center gap-8">
        {navLinks.map((link) => (
          <Link 
            key={link.name} 
            href={link.href}
            className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
          >
            {link.name}
          </Link>
        ))}
      </div>

      {/* Mobile Menu Toggle */}
      <div className="md:hidden">
        <button onClick={() => setIsOpen(!isOpen)} className="text-slate-300 hover:text-white p-2">
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="absolute top-full left-0 w-full glass-panel mt-1 py-4 flex flex-col items-center gap-4 md:hidden border-t border-white/10 shadow-2xl">
          {navLinks.map((link) => (
            <Link 
              key={link.name} 
              href={link.href}
              onClick={() => setIsOpen(false)}
              className="text-base font-medium text-slate-300 hover:text-white w-full text-center py-2"
            >
              {link.name}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
