import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { runHealthCheck } from '@/lib/healthCheck';

export async function POST() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('tv_secure_session')?.value;
    
    if (!sessionToken) {
      return NextResponse.json({ authenticated: false, error: 'Unauthorized session' }, { status: 401 });
    }

    const payload = await verifyToken(sessionToken);
    
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ authenticated: false, error: 'Unauthorized role access' }, { status: 401 });
    }

    // Trigger health check run
    await runHealthCheck();
    
    return NextResponse.json({ success: true, message: 'Health checks completed' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
