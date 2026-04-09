import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Protect the dashboard: redirect to /login if no Supabase auth cookie is present.
// Full session verification happens server-side inside each API route.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === '/') {
    const hasAuthCookie = request.cookies
      .getAll()
      .some(
        (cookie) =>
          cookie.name.startsWith('sb-') && cookie.name.includes('-auth-token'),
      );

    if (!hasAuthCookie) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/'],
};
