import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from './lib/auth';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect Admin UI Pages
  if (pathname.startsWith('/admin')) {
    const sessionToken = request.cookies.get('tv_secure_session')?.value;

    if (!sessionToken) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    const decryptedSession = await verifyToken(sessionToken);
    
    // Explicit Role Check: Drop access if authorization parameters match invalid access keys
    if (!decryptedSession || decryptedSession.role !== 'admin') {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
  }

  // Protect Admin API Routes (exclude check-auth, legacy login, and POST to analytics)
  if (pathname.startsWith('/api/admin')) {
    const isPostAnalytics = pathname === '/api/admin/analytics' && request.method === 'POST';
    const isLegacyLogin = pathname === '/api/admin/login';
    const isCheckAuth = pathname === '/api/admin/check-auth';

    if (!isPostAnalytics && !isLegacyLogin && !isCheckAuth) {
      const sessionToken = request.cookies.get('tv_secure_session')?.value;
      
      if (!sessionToken) {
        return NextResponse.json({ error: 'Unauthorized access: Session missing.' }, { status: 401 });
      }

      const decryptedSession = await verifyToken(sessionToken);
      if (!decryptedSession || decryptedSession.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized access: Admin scope required.' }, { status: 401 });
      }
    }
  }

  return NextResponse.next();
}

// Optimization path configs mapping logic matrix filters list target rules
export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*']
};
