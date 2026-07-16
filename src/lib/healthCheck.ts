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

// Run health checks on all custom channels
export async function runHealthCheck(): Promise<void> {
  if (!fs.existsSync(dataPath)) {
    return;
  }

  try {
    const fileContent = fs.readFileSync(dataPath, 'utf8');
    const channels = JSON.parse(fileContent) as IPTVChannel[];

    if (!Array.isArray(channels) || channels.length === 0) {
      return;
    }

    console.log(`[HealthCheck] Commencing ping checks for ${channels.length} custom channels...`);

    // Perform checks in parallel
    const updatedChannels = await Promise.all(
      channels.map(async (ch) => {
        if (!ch.urls || ch.urls.length === 0) {
          return { ...ch, status: 'Offline' as const };
        }

        // We check the first/primary URL
        const primaryUrl = ch.urls[0];
        const isOnline = await checkUrlStatus(primaryUrl);
        const nextStatus = isOnline ? ('Online' as const) : ('Offline' as const);

        return {
          ...ch,
          status: nextStatus
        };
      })
    );

    // Write updated channels back to disk
    fs.writeFileSync(dataPath, JSON.stringify(updatedChannels, null, 2));
    console.log('[HealthCheck] Custom channels statuses updated successfully.');

    // Append completion log to analytics
    try {
      if (fs.existsSync(analyticsPath)) {
        const analyticsContent = fs.readFileSync(analyticsPath, 'utf8');
        const analyticsData = JSON.parse(analyticsContent);
        analyticsData.logHistory = analyticsData.logHistory || [];
        analyticsData.logHistory.push({
          timestamp: new Date().toISOString(),
          event: `Automated health check executed. Updated ${updatedChannels.length} channel nodes.`
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
    console.error('[HealthCheck] Error during execution:', err);
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
