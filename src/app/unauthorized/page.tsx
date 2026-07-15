'use client';

import Link from 'next/link';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export default function ProtectionAlertPanel() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 text-center font-mono text-xs relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-rose-500/5 blur-[80px] pointer-events-none"></div>

      <div className="border border-rose-500/25 bg-rose-950/10 backdrop-blur-md rounded-3xl p-10 max-w-md space-y-6 shadow-2xl relative z-10 transition-all duration-300 hover:border-rose-500/40">
        <div className="inline-flex items-center justify-center p-4 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-500 animate-pulse">
          <ShieldAlert className="w-10 h-10 filter drop-shadow-[0_0_8px_rgba(239,68,68,0.4)]" />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-rose-500 font-black tracking-widest uppercase text-sm">
            ACCESS PERMISSION VIOLATION
          </h2>
          <p className="text-slate-500 text-[10px] uppercase tracking-wider font-sans">
            Security Tier Clearance Required
          </p>
        </div>

        <p className="text-slate-400 leading-relaxed tracking-tight font-sans text-sm">
          Your current identity token profile does not possess the administrative clearance scopes required to access this system workspace tier.
        </p>

        <div className="pt-4">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 border border-slate-800 hover:border-slate-600 hover:bg-white/5 text-slate-300 hover:text-white px-5 py-3 rounded-2xl transition-all font-sans font-extrabold uppercase tracking-widest text-[10px] cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Client Grid Node</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
