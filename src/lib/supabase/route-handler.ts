import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

function getSupabaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set');
  return url;
}

function getSupabaseAnonKey(): string {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key) throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is not set');
  return key;
}

/**
 * Creates a Supabase client for Route Handlers that writes session cookies
 * onto the provided NextResponse (required for signIn / verifyOtp / signOut).
 */
export function createRouteHandlerClient(request: NextRequest, response: NextResponse) {
  return createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });
}

/** Build a JSON response that auth methods can attach session cookies to. */
export function createAuthJsonResponse<T>(data: T, status = 200): NextResponse {
  return NextResponse.json({ success: true, data }, { status });
}

/**
 * Final JSON response that preserves session cookies set on `cookieSource`.
 * Never copy via `headers: cookieSource.headers` — the Headers API merges
 * multiple Set-Cookie values into one comma-joined header, which browsers reject.
 */
export function toAuthJsonResponse<T>(
  cookieSource: NextResponse,
  data: T,
  status = 200,
): NextResponse {
  const response = NextResponse.json({ success: true, data }, { status });
  cookieSource.cookies.getAll().forEach((cookie) => {
    response.cookies.set(cookie);
  });
  return response;
}

/** Copy session cookies onto a redirect (or any) response. */
export function copyAuthCookies(from: NextResponse, to: NextResponse): NextResponse {
  from.cookies.getAll().forEach((cookie) => {
    to.cookies.set(cookie);
  });
  return to;
}
