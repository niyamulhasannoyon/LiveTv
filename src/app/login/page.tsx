'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trophy, Mail, Lock, User, Eye, EyeOff, Loader2 } from 'lucide-react';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function SecurityGate() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);
    
    const targetUrl = isLogin ? '/api/auth/login' : '/api/auth/signup';
    const payload = isLogin ? { email: form.email, password: form.password } : form;

    try {
      const res = await fetch(targetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || 'Operation failed inside platform node parameters setup.');
        setLoading(false);
      } else {
        if (isLogin) {
          // Save basic contextual identities internally in standard local space logic profiles tracker
          localStorage.setItem('active_auth_profile', JSON.stringify(data.user));
          
          // Dispatch auth state change event to alert components like Navbar
          window.dispatchEvent(new Event('auth-change'));

          // Log event logic analytics framework trigger mapping sequence
          try {
            await fetch('/api/admin/analytics', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'login', username: data.user.username })
            });
          } catch (err) {
            console.error('Analytics log failed:', err);
          }

          router.push(data.user.role === 'admin' ? '/admin' : '/');
        } else {
          alert('Signup database record integration complete! Initializing authorization form portal state.');
          setIsLogin(true);
          setLoading(false);
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Network connection matrix error.');
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMessage('');
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      const sessionRes = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          uid: user.uid,
          username: user.displayName || user.email?.split('@')[0] || 'Verified App User'
        })
      });
      
      const sessionData = await sessionRes.json();
      
      if (!sessionRes.ok) {
        throw new Error(sessionData.error || 'Failed to initialize session.');
      }
      
      localStorage.setItem('active_auth_profile', JSON.stringify(sessionData.user));
      window.dispatchEvent(new Event('auth-change'));
      
      try {
        await fetch('/api/admin/analytics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'login', username: sessionData.user.username })
        });
      } catch (err) {
        console.error('Analytics log failed:', err);
      }
      
      router.push(sessionData.user.role === 'admin' ? '/admin' : '/');
    } catch (err: any) {
      console.error('Google Sign In Error:', err);
      setErrorMessage(err.message || 'Google Sign-In failed.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Dynamic Ambient Background Orbs */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full bg-[#00b4d8]/10 blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 rounded-full bg-rose-500/10 blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md bg-[#141821]/80 backdrop-blur-xl border border-white/5 rounded-3xl p-8 shadow-2xl space-y-8 relative z-10 transition-all duration-300 hover:border-white/10">
        
        {/* Header Section */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center p-3.5 rounded-2xl bg-white/5 border border-white/5 shadow-inner">
            <Trophy className="text-[#00b4d8] w-8 h-8 filter drop-shadow-[0_0_10px_rgba(0,180,216,0.3)] animate-pulse" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white tracking-wider uppercase bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              {isLogin ? 'Identity Gateway' : 'Access Creation'}
            </h2>
            <p className="text-xs text-[#00b4d8] font-bold tracking-widest uppercase mt-1.5 opacity-80">
              LiveTV Encrypted Connection Portal
            </p>
          </div>
        </div>

        {/* Error Alert Box */}
        {errorMessage && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs p-3.5 rounded-2xl font-semibold tracking-wide flex items-center gap-2.5">
            <span className="text-base">⚠️</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Authentication Form */}
        <form onSubmit={handleAction} className="space-y-5">
          {!isLogin && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Username Key</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <User className="w-4 h-4" />
                </span>
                <input 
                  type="text" 
                  placeholder="e.g. administrator" 
                  required
                  value={form.username} 
                  onChange={e => setForm({...form, username: e.target.value})}
                  className="w-full bg-[#090b10] border border-white/5 rounded-2xl pl-10 pr-4 py-3.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#00b4d8] focus:ring-1 focus:ring-[#00b4d8]/30 transition-all font-medium"
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Network Email</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                <Mail className="w-4 h-4" />
              </span>
              <input 
                type="email" 
                placeholder="e.g. node@domain.com" 
                required
                value={form.email} 
                onChange={e => setForm({...form, email: e.target.value})}
                className="w-full bg-[#090b10] border border-white/5 rounded-2xl pl-10 pr-4 py-3.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#00b4d8] focus:ring-1 focus:ring-[#00b4d8]/30 transition-all font-medium"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Cryptographic Key / Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                <Lock className="w-4 h-4" />
              </span>
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="••••••••••••" 
                required
                value={form.password} 
                onChange={e => setForm({...form, password: e.target.value})}
                className="w-full bg-[#090b10] border border-white/5 rounded-2xl pl-10 pr-11 py-3.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#00b4d8] focus:ring-1 focus:ring-[#00b4d8]/30 transition-all font-medium"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Action Trigger Button */}
          <button 
            type="submit" 
            disabled={loading}
            className="w-full relative overflow-hidden group bg-gradient-to-r from-[#00b4d8] to-indigo-600 text-white font-extrabold py-4 rounded-2xl shadow-[0_4px_20px_rgba(0,180,216,0.2)] hover:shadow-[0_4px_25px_rgba(0,180,216,0.3)] hover:opacity-95 transition-all text-xs uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <span>{isLogin ? 'Unlock Terminal Connection' : 'Generate Identity Record'}</span>
            )}
          </button>

          {/* OAuth Google Divider */}
          <div className="flex items-center my-4">
            <div className="flex-grow h-px bg-white/5"></div>
            <span className="text-[10px] font-black uppercase text-slate-500 px-3 tracking-widest">or</span>
            <div className="flex-grow h-px bg-white/5"></div>
          </div>

          {/* Google Login Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 text-white hover:bg-white/10 transition-all font-extrabold text-xs uppercase tracking-widest active:scale-95 cursor-pointer shadow-md"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
            </svg>
            <span>Sign In with Google</span>
          </button>
        </form>

        {/* Dynamic State Toggle */}
        <div className="text-center pt-2 border-t border-white/5">
          <button 
            onClick={() => {
              setIsLogin(!isLogin);
              setErrorMessage('');
            }} 
            className="text-xs text-[#00b4d8] hover:text-white hover:underline transition-all font-bold tracking-wide uppercase"
          >
            {isLogin ? "Need a platform access record? Create footprint →" : "Possess secure account keys? Unlock portal →"}
          </button>
        </div>
      </div>
    </div>
  );
}
