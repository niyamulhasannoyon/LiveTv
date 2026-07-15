import { NextResponse } from 'next/server';

interface IPTVChannel {
  name: string;
  logo: string;
  category: string;
  urls: string[];
}

export async function GET() {
  try {
    // Bangladesh (BD) channel er jonno iptv-org link
    const response = await fetch('https://iptv-org.github.io/iptv/countries/bd.m3u', {
      next: { revalidate: 3600 }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch IPTV data');
    }

    const m3uData = await response.text();
    const channels = parseM3U(m3uData);

    return NextResponse.json(channels);
  } catch (error: any) {
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
