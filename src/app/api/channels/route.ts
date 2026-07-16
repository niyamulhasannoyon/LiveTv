import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

interface IPTVChannel {
  id?: string;
  name: string;
  logo: string;
  category: string;
  urls: string[];
  country?: string;
}

const dataPath = path.join(process.cwd(), 'data', 'custom_channels.json');

function readCustomChannels(): IPTVChannel[] {
  try {
    if (fs.existsSync(dataPath)) {
      const content = fs.readFileSync(dataPath, 'utf8');
      return JSON.parse(content) as IPTVChannel[];
    }
  } catch (e) {
    console.error('Error reading custom channels in feed:', e);
  }
  return [];
}

function normalizeCategory(category: string): string {
  const cat = category.toLowerCase();
  if (cat.includes('sport') || cat.includes('football') || cat.includes('cricket') || cat.includes('golf') || cat.includes('tennis') || cat.includes('cup')) {
    return 'Sports';
  }
  if (cat.includes('news') || cat.includes('info') || cat.includes('talk') || cat.includes('documentary') || cat.includes('politics')) {
    return 'News';
  }
  if (cat.includes('movie') || cat.includes('cinema') || cat.includes('film') || cat.includes('action')) {
    return 'Movies';
  }
  if (cat.includes('kid') || cat.includes('cartoon') || cat.includes('animation') || cat.includes('children') || cat.includes('disney')) {
    return 'Kids';
  }
  return 'Entertainment';
}

export async function GET() {
  try {
    // We will fetch Bangladesh (BD), India (IN) and Global Sports channels concurrently.
    const sources = [
      { url: 'https://iptv-org.github.io/iptv/countries/bd.m3u', country: 'Bangladesh' },
      { url: 'https://iptv-org.github.io/iptv/countries/in.m3u', country: 'India' },
      { url: 'https://iptv-org.github.io/iptv/categories/sports.m3u', country: 'Global Sports' }
    ];

    const fetchPromises = sources.map(async (src) => {
      try {
        const response = await fetch(src.url, { next: { revalidate: 3600 } });
        if (response.ok) {
          const m3uData = await response.text();
          return { data: m3uData, country: src.country };
        }
      } catch (err) {
        console.error(`Failed to fetch channels for ${src.country}:`, err);
      }
      return null;
    });

    const results = await Promise.allSettled(fetchPromises);
    const customChannels = readCustomChannels();
    
    // Grouping map to filter duplicates and merge URLs
    const channelsMap: Record<string, IPTVChannel> = {};

    // 1. First add custom channels (so they have priority and custom stream URLs)
    for (const ch of customChannels) {
      const normalizedCat = normalizeCategory(ch.category);
      channelsMap[ch.name.toLowerCase()] = {
        ...ch,
        category: normalizedCat,
        country: ch.country || 'Bangladesh'
      };
    }

    // 2. Parse external channels
    for (const result of results) {
      if (result.status === 'fulfilled' && result.value) {
        const { data, country } = result.value;
        const parsed = parseM3U(data, country);
        
        for (const ch of parsed) {
          const key = ch.name.toLowerCase();
          
          if (!channelsMap[key]) {
            // Keep maximum of 120 channels per external source to optimize DOM performance
            const sourceCount = Object.values(channelsMap).filter(c => c.country === country).length;
            if (sourceCount < 120 || country === 'Bangladesh') {
              channelsMap[key] = ch;
            }
          } else {
            // If duplicate channel found, merge stream URLs as backup mirrors
            for (const url of ch.urls) {
              if (!channelsMap[key].urls.includes(url)) {
                channelsMap[key].urls.push(url);
              }
            }
          }
        }
      }
    }

    const combined = Object.values(channelsMap);

    return NextResponse.json(combined);
  } catch (error: any) {
    try {
      const customChannels = readCustomChannels();
      if (customChannels.length > 0) {
        return NextResponse.json(customChannels);
      }
    } catch (_) {}
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Simple M3U Parser helper function grouping by channel name
function parseM3U(data: string, country: string): IPTVChannel[] {
  const lines = data.split('\n');
  const channelsList: IPTVChannel[] = [];
  let currentMeta: Partial<Omit<IPTVChannel, 'urls'>> = {};

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('#EXTINF:')) {
      const nameMatch = line.match(/,(.+)$/);
      const logoMatch = line.match(/tvg-logo="([^"]+)"/);
      const groupMatch = line.match(/group-title="([^"]+)"/);

      const rawCategory = groupMatch ? groupMatch[1] : 'General';

      currentMeta = {
        name: nameMatch ? nameMatch[1].trim() : 'Unknown Channel',
        logo: logoMatch ? logoMatch[1] : 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=150&auto=format&fit=crop',
        category: normalizeCategory(rawCategory),
        country: country
      };
    } else if (line.startsWith('http')) {
      const name = currentMeta.name || 'Unknown Channel';
      const streamUrl = line;

      // Only push channels that have valid logos and clean categories
      channelsList.push({
        name,
        logo: currentMeta.logo || 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=150&auto=format&fit=crop',
        category: currentMeta.category || 'General',
        urls: [streamUrl],
        country: currentMeta.country || country
      });
      currentMeta = {};
    }
  }
  return channelsList;
}
