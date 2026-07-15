import React from 'react';
import { siteConfig } from '../config';

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-white/5 py-8 text-center text-slate-400 text-sm">
      <div className="container mx-auto px-4">
        <p className="mb-2">© {new Date().getFullYear()} {siteConfig.siteName}. All rights reserved.</p>
        <p className="opacity-60">{siteConfig.tagline}</p>
      </div>
    </footer>
  );
}
