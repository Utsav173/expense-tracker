import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { cookies } from 'next/headers';

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const authCookie = (await cookies()).get('token')?.value;

  // public routes accessible without any  token
  const publicRoutes = ['/login', '/signup', '/forgot-password', '/reset-password'];

  const isPublicPath = publicRoutes.includes(path);

  if (isPublicPath) {
    return NextResponse.next();
  }

  // for dashboard route must authorize with  auth cookie
  if (!authCookie && !publicRoutes.some((route) => path.startsWith(route))) {
    return NextResponse.redirect(new URL('/login', request.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)'],
};
