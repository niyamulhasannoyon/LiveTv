import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

interface ActiveSession {
  userId: string;
  username: string;
  currentChannel: string;
  lastPing: number;
}

interface LogHistoryEntry {
  timestamp: string;
  event: string;
}

interface AnalyticsData {
  activeSessions: Record<string, ActiveSession>;
  channelViews: Record<string, number>;
  logHistory: LogHistoryEntry[];
}

const analyticsPath = path.join(process.cwd(), 'data', 'analytics.json');

function readAnalytics(): AnalyticsData {
  if (!fs.existsSync(analyticsPath)) {
    const initialData: AnalyticsData = { activeSessions: {}, channelViews: {}, logHistory: [] };
    fs.mkdirSync(path.dirname(analyticsPath), { recursive: true });
    fs.writeFileSync(analyticsPath, JSON.stringify(initialData, null, 2));
    return initialData;
  }
  try {
    const fileContent = fs.readFileSync(analyticsPath, 'utf8');
    const parsed = JSON.parse(fileContent);
    return {
      activeSessions: parsed.activeSessions || {},
      channelViews: parsed.channelViews || {},
      logHistory: parsed.logHistory || []
    };
  } catch (err) {
    console.error('Error reading analytics records:', err);
    return { activeSessions: {}, channelViews: {}, logHistory: [] };
  }
}

function writeAnalytics(data: AnalyticsData) {
  try {
    if (data.logHistory && data.logHistory.length > 100) {
      data.logHistory = data.logHistory.slice(-100);
    }
    fs.writeFileSync(analyticsPath, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error writing analytics records:', err);
  }
}

export async function GET() {
  const data = readAnalytics();
  
  // Clean dead sessions context processing rule window buffer setup 
  const now = Date.now();
  let updated = false;
  
  if (data.activeSessions) {
    Object.keys(data.activeSessions).forEach(sessionId => {
      // 30 seconds buffer baseline logic condition criteria tracking threshold
      if (now - data.activeSessions[sessionId].lastPing > 30000) {
        delete data.activeSessions[sessionId];
        updated = true;
      }
    });
  }

  if (updated) {
    writeAnalytics(data);
  }

  return NextResponse.json({
    concurrentUsers: Object.keys(data.activeSessions).length,
    activeSessions: Object.values(data.activeSessions),
    channelViews: data.channelViews,
    logs: data.logHistory.slice(-20).reverse() // Last 20 actions logs target trace node array elements
  });
}

export async function POST(request: Request) {
  try {
    const { action, userId, username, channelName, sessionId } = await request.json();
    const data = readAnalytics();
    const now = Date.now();

    if (action === 'heartbeat') {
      data.activeSessions[sessionId] = {
        userId,
        username: username || 'Guest Account User',
        currentChannel: channelName || 'Browsing Directory Grid Layout',
        lastPing: now
      };
    } 
    else if (action === 'login') {
      data.logHistory.push({
        timestamp: new Date().toISOString(),
        event: `${username || 'User ID ' + userId} logged into the system platform environment`
      });
    }
    else if (action === 'view_channel' && channelName) {
      data.channelViews[channelName] = (data.channelViews[channelName] || 0) + 1;
      data.logHistory.push({
        timestamp: new Date().toISOString(),
        event: `Channel tuning initialization alert: ${channelName} selected by user ${username || 'Guest'}`
      });
    }

    writeAnalytics(data);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
