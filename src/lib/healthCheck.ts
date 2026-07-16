import { db } from './firebase';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

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

// Check the status of a specific URL
async function checkUrlStatus(url: string): Promise<boolean> {
  if (!url) return false;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout

    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': '*/*'
      }
    });

    clearTimeout(timeoutId);
    return response.ok;
  } catch {
    return false;
  }
}

// Run health checks on all custom channels from Firestore
export async function runHealthCheck(): Promise<void> {
  try {
    console.log(`[HealthCheck] Commencing ping checks for Firestore custom channels...`);
    const channelsCol = collection(db, 'channels');
    const snapshot = await getDocs(channelsCol);
    
    if (snapshot.empty) {
      console.log('[HealthCheck] No custom channels found in Firestore to audit.');
      return;
    }

    const channels: { docId: string; name: string; url: string }[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      const urls = data.urls || (data.url ? [data.url] : []);
      if (urls.length > 0) {
        channels.push({
          docId: doc.id,
          name: data.name || 'Unnamed',
          url: urls[0]
        });
      }
    });

    console.log(`[HealthCheck] Pinging ${channels.length} channel nodes...`);

    // Perform checks in parallel and update Firestore
    await Promise.all(
      channels.map(async (ch) => {
        const isOnline = await checkUrlStatus(ch.url);
        const nextStatus = isOnline ? 'Smooth' : 'Failed';

        const channelRef = doc(db, 'channels', ch.docId);
        await updateDoc(channelRef, {
          status: nextStatus,
          lastChecked: new Date().toISOString()
        });
        console.log(`[HealthCheck] Channel "${ch.name}" evaluated: ${nextStatus}`);
      })
    );

    console.log('[HealthCheck] Firestore custom channels statuses updated successfully.');

    // Append completion log to analytics
    try {
      if (fs.existsSync(analyticsPath)) {
        const analyticsContent = fs.readFileSync(analyticsPath, 'utf8');
        const analyticsData = JSON.parse(analyticsContent);
        analyticsData.logHistory = analyticsData.logHistory || [];
        analyticsData.logHistory.push({
          timestamp: new Date().toISOString(),
          event: `Automated health check executed. Updated ${snapshot.size} channel nodes in Firestore.`
        });
        if (analyticsData.logHistory.length > 100) {
          analyticsData.logHistory = analyticsData.logHistory.slice(-100);
        }
        fs.writeFileSync(analyticsPath, JSON.stringify(analyticsData, null, 2));
      }
    } catch (err) {
      console.error('[HealthCheck] Error updating analytics log history:', err);
    }
  } catch (err) {
    console.error('[HealthCheck] Error during Firestore execution:', err);
  }
}

// Global typing to support singleton tracking in Next.js development server
declare global {
  var healthCheckInterval: NodeJS.Timeout | undefined;
}

// Scheduler initialization wrapper
export function initHealthCheckScheduler(): void {
  if (globalThis.healthCheckInterval) {
    return; // Already initialized
  }

  // Execute immediately on startup
  runHealthCheck();

  // Run health check every 1 hour (3,600,000 milliseconds)
  globalThis.healthCheckInterval = setInterval(() => {
    runHealthCheck();
  }, 3600000);

  console.log('[HealthCheck] Scheduler successfully armed. Runs every 1 hour.');
}
