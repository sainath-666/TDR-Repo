import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import type { UserRole } from '@/types';
import { isOfficialRole } from '@/types';
import {
  getCitizenSessionFromRequest,
  isCitizenOnlyRoute,
  isSharedCitizenApiRoute,
} from '@/lib/citizen-session';

const PUBLIC_ROUTES = [
  '/',
  '/farmer-login',
  '/official-login',
  '/verify',
  '/tdr-bank',
  '/instructions',
  '/calculator',
  '/status',
  '/application',
  '/api/portal',
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
  if (pathname.startsWith('/images/')) return true;
  if (isPublicApiRoute(pathname)) return true;
  return PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

function getLoginRedirect(pathname: string): string {
  if (
    pathname.startsWith('/farmer') ||
    pathname.startsWith('/api/bonds/farmer') ||
    pathname.startsWith('/api/dashboard/farmer')
  ) {
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

function applyIdleTimeout(request: NextRequest, loginPath: string): NextResponse | null {
  const lastActive = request.cookies.get('last_active')?.value;
  if (!lastActive) return null;

  const elapsed = Date.now() - parseInt(lastActive, 10);
  if (elapsed <= IDLE_TIMEOUT_MS) return null;

  const loginUrl = new URL(loginPath, request.url);
  loginUrl.searchParams.set('reason', 'idle');
  const idleResponse = NextResponse.redirect(loginUrl);
  idleResponse.cookies.delete('last_active');
  idleResponse.cookies.delete('citizen_session');
  return idleResponse;
}

function touchLastActive(response: NextResponse): void {
  response.cookies.set('last_active', String(Date.now()), {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 1800,
  });
}

async function handleCitizenRoute(request: NextRequest): Promise<NextResponse> {
  const idleRedirect = applyIdleTimeout(request, '/farmer-login');
  if (idleRedirect) return idleRedirect;

  const citizen = await getCitizenSessionFromRequest(request);
  if (!citizen) {
    return NextResponse.redirect(new URL('/farmer-login', request.url));
  }

  const response = NextResponse.next({ request });
  touchLastActive(response);
  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  if (isCitizenOnlyRoute(pathname)) {
    return await handleCitizenRoute(request);
  }

  const citizen = await getCitizenSessionFromRequest(request);
  if (isSharedCitizenApiRoute(pathname) && citizen) {
    const idleRedirect = applyIdleTimeout(request, '/farmer-login');
    if (idleRedirect) return idleRedirect;

    const response = NextResponse.next({ request });
    touchLastActive(response);
    return response;
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

  const idleRedirect = applyIdleTimeout(request, getLoginRedirect(pathname));
  if (idleRedirect) return idleRedirect;

  touchLastActive(response);

  const session = await supabase.auth.getSession();
  const jwtUser = session.data.session?.access_token
    ? extractUserFromJwt(session.data.session.access_token)
    : null;

  const role = jwtUser?.role;
  if (!role) {
    const loginUrl = new URL(getLoginRedirect(pathname), request.url);
    loginUrl.searchParams.set('reason', 'unauthorized');
    return NextResponse.redirect(loginUrl);
  }

  if (!checkRouteAccess(pathname, role)) {
    return NextResponse.redirect(new URL('/official-login?reason=unauthorized', request.url));
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|manifest.json|locales|images).*)'],
};
