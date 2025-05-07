import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { cookies } from 'next/headers';

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const authCookie = (await cookies()).get('token')?.value;

  const publicRoutes = [
    '/',
    '/auth/login',
    '/auth/signup',
    '/auth/forgot-password',
    '/auth/reset-password',
    '/legal/privacy-policy',
    '/legal/terms-of-service',
    '/support/contact'
  ];
  const isPublicPath = publicRoutes.some((route) => path.startsWith(route));

  // If not authenticated and trying to access protected routes
  if (!authCookie && !isPublicPath) {
    // Clear any existing auth cookies
    (await cookies()).delete('token');
    (await cookies()).delete('user');
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|favicon.svg|sitemap.xml|robots.txt).*)']
};
