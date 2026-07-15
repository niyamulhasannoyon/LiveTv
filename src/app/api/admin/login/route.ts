import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { passkey } = await request.json();
    const adminPasskey = process.env.ADMIN_PASSKEY || 'admin2026';
    
    if (passkey === adminPasskey) {
      const response = NextResponse.json({ success: true });
      response.cookies.set('admin_session', 'authenticated', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24, // 1 day
        path: '/'
      });
      return response;
    }
    
    return NextResponse.json({ success: false, error: 'Incorrect Passkey' }, { status: 401 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
