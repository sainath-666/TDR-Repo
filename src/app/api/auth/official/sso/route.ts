import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandling } from '@/lib/errors';
import { ok } from '@/lib/api-response';
import { createServerClient } from '@/lib/supabase/client';
import { writeAuditLog } from '@/lib/audit';
import { getClientIp } from '@/lib/bond-helpers';

const DEV_PASSWORD = 'DevPassword123!';

async function startOAuth(req: NextRequest) {
  const supabase = createServerClient(cookies());

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${req.nextUrl.origin}/auth/callback?next=/deo/dashboard`,
    },
  });

  if (error || !data.url) {
    return {
      error:
        error?.message ??
        'SSO is not configured. Enable Google/OIDC in Supabase or use Dev Login below.',
    };
  }

  await writeAuditLog({
    action: 'OFFICIAL_LOGIN',
    details: { provider: 'nic-sso' },
    ipAddress: getClientIp(req.headers),
  });

  return { url: data.url };
}

/** Browser link — only when SSO is enabled in Supabase */
export async function GET(req: NextRequest) {
  if (process.env.NEXT_PUBLIC_OFFICIAL_SSO_ENABLED !== 'true') {
    const loginUrl = new URL('/official-login', req.url);
    loginUrl.searchParams.set(
      'error',
      'NIC SSO is not enabled. Use Dev Login below (local development).',
    );
    return NextResponse.redirect(loginUrl);
  }

  const result = await startOAuth(req);

  if ('url' in result && result.url) {
    return NextResponse.redirect(result.url);
  }

  const loginUrl = new URL('/official-login', req.url);
  loginUrl.searchParams.set('error', result.error ?? 'SSO unavailable');
  return NextResponse.redirect(loginUrl);
}

export const POST = withErrorHandling(async (req: NextRequest) => {
  const result = await startOAuth(req);

  if ('error' in result) {
    return ok({ message: result.error });
  }

  return ok({ url: result.url });
});

export const DEV_PASSWORD_EXPORT = DEV_PASSWORD;
