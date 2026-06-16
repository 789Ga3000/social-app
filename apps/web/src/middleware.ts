import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_ROUTES = ['/login', '/signup'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublicRoute = PUBLIC_ROUTES.some((route) =>
    pathname.startsWith(route),
  );
  const hasAccessToken = request.cookies.has('access_token');

  if (!hasAccessToken && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (hasAccessToken && isPublicRoute) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/v1).*)'],
};
