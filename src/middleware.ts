import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import type { UserRole } from '@/types';
import { isOfficialRole } from '@/types';

const PUBLIC_ROUTES = [
  '/farmer-login',
  '/official-login',
  '/verify',
  '/auth/callback',
  '/api/auth',
  '/api/health',
];

function isPublicApiRoute(pathname: string): boolean {
  if (pathname.match(/^\/api\/certificates\/[^/]+\/verify$/)) return true;
  return false;
}

const IDLE_TIMEOUT_MS = 30 * 60 * 1000;

function isPublicRoute(pathname: string): boolean {
  if (pathname.startsWith('/_next') || pathname === '/favicon.ico') return true;
  if (isPublicApiRoute(pathname)) return true;
  return PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

function getLoginRedirect(pathname: string): string {
  if (pathname.startsWith('/farmer') || pathname.startsWith('/api/bonds/farmer')) {
    return '/farmer-login';
  }
  return '/official-login';
}

function extractUserFromJwt(accessToken: string): { role: UserRole } | null {
  try {
    const payload = JSON.parse(atob(accessToken.split('.')[1] ?? '')) as {
      app_metadata?: { role?: UserRole };
    };
    if (!payload.app_metadata?.role) return null;
    return { role: payload.app_metadata.role };
  } catch {
    return null;
  }
}

function checkRouteAccess(pathname: string, role: UserRole): boolean {
  if (pathname.startsWith('/farmer')) return role === 'FARMER';
  if (pathname.startsWith('/deo')) return role === 'DEO' || role === 'SURVEYOR';
  if (pathname.startsWith('/official')) return isOfficialRole(role);
  if (pathname.startsWith('/commissioner')) {
    return role === 'COMMISSIONER' || role === 'ADDL_COMMISSIONER';
  }
  if (pathname.startsWith('/api/users')) {
    return role === 'COMMISSIONER' || role === 'ADDL_COMMISSIONER';
  }
  return true;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const loginUrl = new URL(getLoginRedirect(pathname), request.url);
    return NextResponse.redirect(loginUrl);
  }

  const lastActive = request.cookies.get('last_active')?.value;
  if (lastActive) {
    const elapsed = Date.now() - parseInt(lastActive, 10);
    if (elapsed > IDLE_TIMEOUT_MS) {
      const loginUrl = new URL(getLoginRedirect(pathname), request.url);
      loginUrl.searchParams.set('reason', 'idle');
      const idleResponse = NextResponse.redirect(loginUrl);
      idleResponse.cookies.delete('last_active');
      return idleResponse;
    }
  }

  response.cookies.set('last_active', String(Date.now()), {
    httpOnly: true,
    sameSite: 'strict',
    path: '/',
    maxAge: 1800,
  });

  const session = await supabase.auth.getSession();
  const jwtUser = session.data.session?.access_token
    ? extractUserFromJwt(session.data.session.access_token)
    : null;

  const role = jwtUser?.role;
  if (role && !checkRouteAccess(pathname, role)) {
    return NextResponse.redirect(new URL('/official-login?reason=unauthorized', request.url));
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|manifest.json|locales).*)'],
};
