import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { signToken } from '@/lib/auth';

const usersPath = path.join(process.cwd(), 'data', 'users.json');

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    
    if (!fs.existsSync(usersPath)) return NextResponse.json({ error: 'Invalid authentication credentials.' }, { status: 400 });
    const users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));

    const user = users.find((u: any) => u.email === email);
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return NextResponse.json({ error: 'Authentication matrix signature verification failed.' }, { status: 400 });
    }

    // Generate secure session payload parameters matrix
    const token = await signToken({ userId: user.id, username: user.username, role: user.role });

    const response = NextResponse.json({ 
      success: true, 
      user: { username: user.username, role: user.role } 
    });

    // Encrypt security inside HTTP-Only cookie pipeline architecture node layers
    response.cookies.set('tv_secure_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 Days active session time validation block
      path: '/'
    });

    return response;
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
