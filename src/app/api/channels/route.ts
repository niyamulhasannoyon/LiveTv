import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

interface IPTVChannel {
  id?: string;
  name: string;
  logo: string;
  category: string;
  urls: string[];
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

export async function GET() {
  try {
    // Bangladesh (BD) channel er jonno iptv-org link
    const response = await fetch('https://iptv-org.github.io/iptv/countries/bd.m3u', {
      next: { revalidate: 3600 }
    });

    let channels: IPTVChannel[] = [];
    if (response.ok) {
      const m3uData = await response.text();
      channels = parseM3U(m3uData);
    } else {
      console.error('Failed to fetch external IPTV data');
    }

    // Merge custom channels at the beginning of the list
    const customChannels = readCustomChannels();
    const combined = [...customChannels, ...channels];

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
function parseM3U(data: string): IPTVChannel[] {
  const lines = data.split('\n');
  const channelsMap: Record<string, IPTVChannel> = {};
  let currentMeta: Partial<Omit<IPTVChannel, 'urls'>> = {};

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('#EXTINF:')) {
      const nameMatch = line.match(/,(.+)$/);
      const logoMatch = line.match(/tvg-logo="([^"]+)"/);
      const groupMatch = line.match(/group-title="([^"]+)"/);

      currentMeta = {
        name: nameMatch ? nameMatch[1].trim() : 'Unknown Channel',
        logo: logoMatch ? logoMatch[1] : 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=150&auto=format&fit=crop',
        category: groupMatch ? groupMatch[1] : 'General'
      };
    } else if (line.startsWith('http')) {
      const name = currentMeta.name || 'Unknown Channel';
      const streamUrl = line;

      if (!channelsMap[name]) {
        channelsMap[name] = {
          name,
          logo: currentMeta.logo || 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=150&auto=format&fit=crop',
          category: currentMeta.category || 'General',
          urls: [streamUrl]
        };
      } else {
        // If channel already exists, push this as a backup url/mirror
        if (!channelsMap[name].urls.includes(streamUrl)) {
          channelsMap[name].urls.push(streamUrl);
        }
      }
      currentMeta = {};
    }
  }
  return Object.values(channelsMap);
}
