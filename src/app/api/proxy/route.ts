import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const targetUrl = searchParams.get('url');
  const referer = searchParams.get('referer');

  if (!targetUrl) {
    return new Response('Missing URL parameter', { status: 400 });
  }

  try {
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        ...(referer ? { 'Referer': referer } : {})
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      return new Response(`Failed to fetch target URL: ${response.statusText}`, { status: response.status });
    }

    const contentType = response.headers.get('content-type') || '';
    
    // If it's a playlist manifest file, we read and rewrite relative paths to absolute paths
    if (contentType.includes('mpegurl') || contentType.includes('mpegURL') || targetUrl.includes('.m3u8')) {
      const text = await response.text();
      
      const lines = text.split('\n');
      const rewrittenLines = lines.map(line => {
        const trimmed = line.trim();
        if (trimmed.length === 0 || trimmed.startsWith('#')) {
          // If it's a metadata tag like #EXT-X-KEY, it might contain a URI attribute that needs proxying
          if (trimmed.startsWith('#EXT-X-KEY:') && trimmed.includes('URI=')) {
            try {
              // Extract the URI value between quotes
              const uriMatch = trimmed.match(/URI="([^"]+)"/);
              if (uriMatch && uriMatch[1]) {
                const relativeUri = uriMatch[1];
                const absoluteUri = new URL(relativeUri, targetUrl).toString();
                // Route key URI through proxy to bypass CORS
                const proxiedUri = `/api/proxy?url=${encodeURIComponent(absoluteUri)}`;
                return trimmed.replace(`URI="${relativeUri}"`, `URI="${proxiedUri}"`);
              }
            } catch (err) {
              console.error('Error parsing URI in EXT-X-KEY:', err);
            }
          }
          return line;
        }

        try {
          // Resolve relative URL to absolute URL relative to the targetUrl
          const absoluteUrl = new URL(trimmed, targetUrl).toString();

          // If the resolved URL itself points to another playlist (multi-bitrate HLS), proxy it too
          if (absoluteUrl.includes('.m3u8')) {
            return `/api/proxy?url=${encodeURIComponent(absoluteUrl)}`;
          }

          return absoluteUrl;
        } catch (e) {
          return line;
        }
      });

      return new Response(rewrittenLines.join('\n'), {
        status: 200,
        headers: {
          'Content-Type': contentType || 'application/vnd.apple.mpegurl',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': '*',
        }
      });
    }

    // For other resource types (e.g. images or chunks if requested), pipe the raw body
    const body = response.body;
    return new Response(body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': '*',
      }
    });

  } catch (error: any) {
    console.error('Proxy error:', error);
    return new Response(`Proxy error: ${error.message}`, { status: 500 });
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': '*',
    }
  });
}
