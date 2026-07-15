import { NextResponse } from 'next/server';

interface CacheEntry {
  data: any[];
  timestamp: number;
}

let cache: CacheEntry | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
let isRevalidating = false;

async function verifyStream(url: string, referrer?: string, userAgent?: string): Promise<boolean> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

  try {
    const headers: Record<string, string> = {
      'User-Agent': userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    };
    if (referrer) {
      headers['Referer'] = referrer;
    }

    const res = await fetch(url, {
      method: 'GET',
      headers,
      signal: controller.signal,
      cache: 'no-store'
    });

    clearTimeout(timeoutId);
    return res.status >= 200 && res.status < 400;
  } catch (error) {
    clearTimeout(timeoutId);
    return false;
  }
}

async function fetchAndCheckStreams() {
  try {
    const [streamsRes, channelsRes] = await Promise.all([
      fetch('https://iptv-org.github.io/api/streams.json', { next: { revalidate: 3600 } }),
      fetch('https://iptv-org.github.io/api/channels.json', { next: { revalidate: 3600 } })
    ]);

    if (!streamsRes.ok || !channelsRes.ok) {
      throw new Error('Failed to fetch data from iptv-org api endpoints');
    }

    const streams: any[] = await streamsRes.json();
    const channels: any[] = await channelsRes.json();

    // Filter Bangladesh streams
    const bdStreams = streams.filter(s => 
      s.channel && (s.channel.toLowerCase().includes('.bd') || s.channel.toLowerCase().endsWith('bd'))
    );

    // Create lookup map for channel detail objects
    const channelMap = new Map<string, any>();
    channels.forEach(c => {
      if (c.id) channelMap.set(c.id.toLowerCase(), c);
    });

    // Run active verification checks in parallel
    const verifiedStreams = await Promise.all(
      bdStreams.map(async (stream) => {
        const channelKey = stream.channel.toLowerCase();
        const channelInfo = channelMap.get(channelKey) || {};
        
        const isOnline = await verifyStream(stream.url, stream.http_referrer, stream.user_agent);

        let category = 'IPTV BD';
        if (channelInfo.categories && channelInfo.categories.length > 0) {
          // Capitalize first letter of category
          const cat = channelInfo.categories[0];
          category = cat.charAt(0).toUpperCase() + cat.slice(1);
        }

        return {
          id: stream.channel,
          name: channelInfo.name || stream.channel.toUpperCase().replace('.BD', ''),
          logoUrl: channelInfo.logo || 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=150&auto=format&fit=crop',
          category: category,
          url: stream.url,
          httpReferrer: stream.http_referrer || null,
          userAgent: stream.user_agent || null,
          status: isOnline ? 'Stable' : 'Offline'
        };
      })
    );

    // Sort: Online/Stable streams first, then alphabetically by name
    verifiedStreams.sort((a, b) => {
      if (a.status === 'Stable' && b.status !== 'Stable') return -1;
      if (a.status !== 'Stable' && b.status === 'Stable') return 1;
      return a.name.localeCompare(b.name);
    });

    return verifiedStreams;
  } catch (error) {
    console.error('Error fetching and validating IPTV streams:', error);
    return [];
  }
}

export async function GET() {
  const now = Date.now();

  // If no cache, fetch sync to populate cache initially
  if (!cache) {
    const data = await fetchAndCheckStreams();
    cache = { data, timestamp: now };
    return NextResponse.json(data);
  }

  // If cache is expired, trigger background revalidation
  const isExpired = now - cache.timestamp > CACHE_DURATION;
  if (isExpired && !isRevalidating) {
    isRevalidating = true;
    fetchAndCheckStreams()
      .then(data => {
        if (data.length > 0) {
          cache = { data, timestamp: Date.now() };
        }
      })
      .finally(() => {
        isRevalidating = false;
      });
  }

  // Return cached data immediately (Stale-While-Revalidate style)
  return NextResponse.json(cache.data);
}
