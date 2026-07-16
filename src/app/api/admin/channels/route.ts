import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { initHealthCheckScheduler } from '../../../../lib/healthCheck';

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

// Helper function to read persisted index records matrix code parsing
function readData(): IPTVChannel[] {
  if (!fs.existsSync(path.dirname(dataPath))) {
    fs.mkdirSync(path.dirname(dataPath), { recursive: true });
  }
  if (!fs.existsSync(dataPath)) {
    fs.writeFileSync(dataPath, JSON.stringify([]));
    return [];
  }
  try {
    const content = fs.readFileSync(dataPath, 'utf8');
    return JSON.parse(content) as IPTVChannel[];
  } catch (err) {
    console.error('Error reading custom channels file:', err);
    return [];
  }
}

export async function GET() {
  initHealthCheckScheduler();
  const customData = readData();
  return NextResponse.json(customData);
}

export async function POST(request: Request) {
  try {
    initHealthCheckScheduler();
    const newChannel: IPTVChannel = await request.json();
    const currentChannels = readData();
    
    // Auto incremental primary identification validation pipeline token generate
    newChannel.id = Date.now().toString();
    newChannel.status = 'Online'; // Default status to Online until checked
    newChannel.failure_count = 0; // Default failures to 0
    currentChannels.unshift(newChannel);
    
    fs.writeFileSync(dataPath, JSON.stringify(currentChannels, null, 2));
    return NextResponse.json({ success: true, data: newChannel });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown server error';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    initHealthCheckScheduler();
    const updatedChannel: IPTVChannel = await request.json();
    if (!updatedChannel.id) {
      return NextResponse.json({ success: false, error: 'Channel ID is required' }, { status: 400 });
    }

    const currentChannels = readData();
    const index = currentChannels.findIndex(c => c.id === updatedChannel.id);
    if (index === -1) {
      return NextResponse.json({ success: false, error: 'Channel not found' }, { status: 404 });
    }

    const existing = currentChannels[index];
    
    // Merge updated fields, preserving metadata like status/failures if not explicitly overridden
    currentChannels[index] = {
      ...existing,
      ...updatedChannel,
      urls: updatedChannel.urls || existing.urls
    };

    fs.writeFileSync(dataPath, JSON.stringify(currentChannels, null, 2));
    
    // Try logging edit event in analytics
    try {
      const analyticsPath = path.join(process.cwd(), 'data', 'analytics.json');
      if (fs.existsSync(analyticsPath)) {
        const analyticsContent = fs.readFileSync(analyticsPath, 'utf8');
        const analyticsData = JSON.parse(analyticsContent);
        analyticsData.logHistory = analyticsData.logHistory || [];
        analyticsData.logHistory.push({
          timestamp: new Date().toISOString(),
          event: `✏️ CHANNEL EDITED: Channel node "${existing.name}" was modified to "${updatedChannel.name}"`
        });
        if (analyticsData.logHistory.length > 100) {
          analyticsData.logHistory = analyticsData.logHistory.slice(-100);
        }
        fs.writeFileSync(analyticsPath, JSON.stringify(analyticsData, null, 2));
      }
    } catch {}

    return NextResponse.json({ success: true, data: currentChannels[index] });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown server error';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    let currentChannels = readData();
    currentChannels = currentChannels.filter(c => c.id !== id);
    
    fs.writeFileSync(dataPath, JSON.stringify(currentChannels, null, 2));
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown server error';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
