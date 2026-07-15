import React from 'react';
import GlassCard from '../../components/GlassCard';
import { siteConfig } from '../../config';

export default function AboutPage() {
  const { title, content } = siteConfig.pages.about;

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <GlassCard className="p-8 md:p-12" hoverEffect={false}>
        <h1 className="text-3xl md:text-4xl font-bold mb-8 text-white">{title}</h1>
        <div className="space-y-6 text-slate-300 leading-relaxed text-lg">
          {content.map((paragraph, idx) => (
            <p key={idx}>{paragraph}</p>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
