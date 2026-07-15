import { NextResponse } from 'next/server';
import { signToken } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { email, uid, username } = await request.json();

    // Assign custom authorization variables target properties control dynamic scope rules context definition runtime checks
    const role = email === 'niyamulhasanbd@gmail.com' ? 'admin' : 'user';

    // Pack inside robust web crypto token standard data formats properties structures layers
    const sessionToken = await signToken({ userId: uid, username: username || 'Verified App User', role });

    const response = NextResponse.json({ success: true, user: { username: username || 'Verified App User', role } });

    response.cookies.set('tv_secure_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/'
    });

    return response;
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
