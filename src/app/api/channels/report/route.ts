import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

interface IPTVChannel {
  id?: string;
  name: string;
  logo: string;
  category: string;
  urls: string[];
  status?: 'Online' | 'Offline';
  failure_count?: number;
}

const dataPath = path.join(process.cwd(), 'data', 'custom_channels.json');
const analyticsPath = path.join(process.cwd(), 'data', 'analytics.json');

export async function POST(request: Request) {
  try {
    const { channelName, url } = await request.json();
    if (!channelName) {
      return NextResponse.json({ success: false, error: 'Channel name is required' }, { status: 400 });
    }

    console.log(`[ErrorReporter] Received playback error for channel: "${channelName}" (URL: ${url || 'unknown'})`);

    // 1. Update failure count and status in custom_channels.json (if it is a custom channel)
    let isCustomChannel = false;
    if (fs.existsSync(dataPath)) {
      try {
        const fileContent = fs.readFileSync(dataPath, 'utf8');
        const channels = JSON.parse(fileContent) as IPTVChannel[];

        if (Array.isArray(channels)) {
          const index = channels.findIndex(
            c => c.name.toLowerCase() === channelName.toLowerCase()
          );

          if (index !== -1) {
            isCustomChannel = true;
            channels[index].failure_count = (channels[index].failure_count || 0) + 1;
            channels[index].status = 'Offline'; // Mark offline due to report
            fs.writeFileSync(dataPath, JSON.stringify(channels, null, 2));
            console.log(`[ErrorReporter] Custom channel "${channelName}" updated. Failures: ${channels[index].failure_count}`);
          }
        }
      } catch (err) {
        console.error('[ErrorReporter] Failed to update custom channel failure count:', err);
      }
    }

    // 2. Append event to analytics log history
    try {
      if (fs.existsSync(analyticsPath)) {
        const analyticsContent = fs.readFileSync(analyticsPath, 'utf8');
        const analyticsData = JSON.parse(analyticsContent);
        analyticsData.logHistory = analyticsData.logHistory || [];
        
        analyticsData.logHistory.push({
          timestamp: new Date().toISOString(),
          event: `🚨 STREAM ERROR: Playback failed for "${channelName}" ${isCustomChannel ? '(Custom Node)' : '(External)'}${url ? ' on link: ' + url : ''}`
        });

        if (analyticsData.logHistory.length > 100) {
          analyticsData.logHistory = analyticsData.logHistory.slice(-100);
        }
        fs.writeFileSync(analyticsPath, JSON.stringify(analyticsData, null, 2));
      }
    } catch (err) {
      console.error('[ErrorReporter] Failed to write event to analytics logs:', err);
    }

    return NextResponse.json({ success: true, isCustomChannel });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown server error';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
