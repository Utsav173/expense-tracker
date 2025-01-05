import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtDecode } from 'jwt-decode';

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  const isAuth = request.cookies.has('token') && jwtDecode(request.cookies.get('token')?.value!);
  const isPublicPath = path.startsWith('/auth');
  // If path is "/"
  if (path === '/') {
    if (isAuth) {
      return NextResponse.redirect(new URL('/dashboard', request.nextUrl));
    }
    return NextResponse.next();
  }

  // If path is auth route
  if (isPublicPath) {
    if (isAuth) {
      return NextResponse.redirect(new URL('/dashboard', request.nextUrl));
    }
    return NextResponse.next();
  }

  // For all other protected routes
  if (!isAuth) {
    return NextResponse.redirect(new URL('/login', request.nextUrl));
  }

  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    '/',
    '/dashboard',
    '/accounts/:path*',
    '/transactions/:path*',
    '/budget/:path*',
    '/goal/:path*',
    '/investment/:path*',
    '/debts/:path*',
  ],
};
