import React from 'react';
import GlassCard from '../../components/GlassCard';
import { siteConfig } from '../../config';

export default function TermsPage() {
  const { title, lastUpdated, sections } = siteConfig.pages.terms;

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <GlassCard className="p-8 md:p-12" hoverEffect={false}>
        <div className="mb-10 border-b border-white/10 pb-6">
          <h1 className="text-3xl md:text-4xl font-bold mb-3 text-white">{title}</h1>
          <p className="text-slate-400 text-sm">Last Updated: {lastUpdated}</p>
        </div>
        <div className="space-y-8">
          {sections.map((section, idx) => (
            <div key={idx}>
              <h2 className="text-xl font-semibold text-white mb-3">{section.heading}</h2>
              <p className="text-slate-300 leading-relaxed">{section.text}</p>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
