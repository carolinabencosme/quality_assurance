import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED = ['/dashboard', '/products', '/audit', '/reports', '/stock'];

export function middleware(request: NextRequest) {
  const token = request.cookies.get('inventory_access')?.value;
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  const isLogin = pathname === '/';

  if (isProtected && !token) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    url.searchParams.set('reason', 'session');
    return NextResponse.redirect(url);
  }

  if (isLogin && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/dashboard/:path*', '/products/:path*', '/audit/:path*', '/reports/:path*', '/stock/:path*'],
};
