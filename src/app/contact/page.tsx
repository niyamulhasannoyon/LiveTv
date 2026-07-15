import React from 'react';
import { Mail, MapPin, Phone } from 'lucide-react';
import GlassCard from '../../components/GlassCard';
import { siteConfig } from '../../config';

export default function ContactPage() {
  const { title, subtitle, address, phone, email } = siteConfig.pages.contact;

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <GlassCard className="p-8 md:p-12" hoverEffect={false}>
        <div className="text-center mb-12 border-b border-white/10 pb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-4 text-white">{title}</h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">{subtitle}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Contact Info */}
          <div className="space-y-8">
            <h2 className="text-2xl font-semibold text-white mb-6">Contact Information</h2>
            
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 flex-shrink-0">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-white font-medium mb-1">Office Address</h3>
                <p className="text-slate-400">{address}</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 flex-shrink-0">
                <Phone className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-white font-medium mb-1">Phone Number</h3>
                <p className="text-slate-400">{phone}</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0">
                <Mail className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-white font-medium mb-1">Email Address</h3>
                <p className="text-slate-400">{email}</p>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div>
            <h2 className="text-2xl font-semibold text-white mb-6">Send a Message</h2>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Full Name</label>
                <input 
                  type="text" 
                  className="w-full rounded-xl p-3 glass-input transition-colors"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Email</label>
                <input 
                  type="email" 
                  className="w-full rounded-xl p-3 glass-input transition-colors"
                  placeholder="john@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Message</label>
                <textarea 
                  rows={4}
                  className="w-full rounded-xl p-3 glass-input transition-colors resize-none"
                  placeholder="How can we help you?"
                ></textarea>
              </div>
              <button 
                type="button"
                className="w-full py-3 px-6 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-semibold transition-colors mt-2"
              >
                Send Message
              </button>
            </form>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
