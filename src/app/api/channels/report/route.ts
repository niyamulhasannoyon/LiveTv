import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { db } from '../../../../lib/firebase';
import { collection, getDocs, doc, updateDoc, increment } from 'firebase/firestore';

interface IPTVChannel {
  id?: string;
  name: string;
  logo: string;
  category: string;
  urls: string[];
  status?: string;
  failure_count?: number;
  isGeoBlocked?: boolean;
  country?: string;
}

const analyticsPath = path.join(process.cwd(), 'data', 'analytics.json');

export async function POST(request: Request) {
  try {
    const { channelName, url } = await request.json();
    if (!channelName) {
      return NextResponse.json({ success: false, error: 'Channel name is required' }, { status: 400 });
    }

    console.log(`[ErrorReporter] Received playback error for channel: "${channelName}" (URL: ${url || 'unknown'})`);

    // 1. Update failure count and status in Firestore (if it is a custom channel)
    let isCustomChannel = false;
    try {
      const channelsCol = collection(db, 'channels');
      const snapshot = await getDocs(channelsCol);
      let targetDocId: string | null = null;
      let currentFailures = 0;

      snapshot.forEach((doc) => {
        const val = doc.data();
        if (val.name && val.name.toLowerCase() === channelName.toLowerCase()) {
          targetDocId = doc.id;
          currentFailures = val.failureCount ?? val.failure_count ?? 0;
        }
      });

      if (targetDocId) {
        isCustomChannel = true;
        const channelRef = doc(db, 'channels', targetDocId);
        await updateDoc(channelRef, {
          status: 'Failed',
          failureCount: increment(1),
          failure_count: increment(1),
          lastChecked: new Date().toISOString()
        });
        console.log(`[ErrorReporter] Custom channel "${channelName}" updated in Firestore. Previous failures: ${currentFailures}`);
      }
    } catch (err) {
      console.error('[ErrorReporter] Failed to update Firestore channel failure count:', err);
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
