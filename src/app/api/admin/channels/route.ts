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
  const customData = readData();
  return NextResponse.json(customData);
}

export async function POST(request: Request) {
  try {
    const newChannel: IPTVChannel = await request.json();
    const currentChannels = readData();
    
    // Auto incremental primary identification validation pipeline token generate
    newChannel.id = Date.now().toString();
    currentChannels.unshift(newChannel);
    
    fs.writeFileSync(dataPath, JSON.stringify(currentChannels, null, 2));
    return NextResponse.json({ success: true, data: newChannel });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    let currentChannels = readData();
    currentChannels = currentChannels.filter(c => c.id !== id);
    
    fs.writeFileSync(dataPath, JSON.stringify(currentChannels, null, 2));
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
