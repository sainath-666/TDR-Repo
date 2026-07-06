import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandling, AuthenticationError } from '@/lib/errors';
import { officialLoginSchema } from '@/lib/validations/auth';
import {
  copyAuthCookies,
  createAuthJsonResponse,
  createRouteHandlerClient,
  toAuthJsonResponse,
} from '@/lib/supabase/route-handler';
import { prisma } from '@/lib/prisma';
import { writeAuditLog } from '@/lib/audit';
import { getClientIp } from '@/lib/bond-helpers';
import { isOfficialRole, type UserRole } from '@/types';
import { getOfficialDashboardPath } from '@/lib/approval-levels';
import { clearCitizenSessionCookie } from '@/lib/citizen-session';

function getRedirectForRole(role: UserRole): string {
  return getOfficialDashboardPath(role);
}

async function parseLoginBody(req: NextRequest): Promise<{ email: string; password: string }> {
  const contentType = req.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    return officialLoginSchema.parse(await req.json());
  }
  const form = await req.formData();
  return officialLoginSchema.parse({
    email: form.get('email'),
    password: form.get('password'),
  });
}

async function resolveOfficialRole(
  userId: string,
  appMeta: Record<string, string | undefined>,
): Promise<UserRole | null> {
  const metaRole = appMeta.role as UserRole | undefined;
  if (metaRole && isOfficialRole(metaRole)) return metaRole;

  const official = await prisma.official.findUnique({
    where: { id: userId },
    select: { role: true, isActive: true },
  });
  if (official?.isActive) return official.role as UserRole;

  return null;
}

export const POST = withErrorHandling(async (req: NextRequest) => {
  const { email, password } = await parseLoginBody(req);
  const wantsJson = req.headers.get('accept')?.includes('application/json');

  const response = createAuthJsonResponse({ redirectTo: '/' });
  const supabase = createRouteHandlerClient(req, response);

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });

  if (error || !data.user) {
    throw new AuthenticationError(error?.message ?? 'Invalid email or password');
  }

  const appMeta = (data.user.app_metadata ?? {}) as Record<string, string | undefined>;
  const role = await resolveOfficialRole(data.user.id, appMeta);

  if (!role || !isOfficialRole(role)) {
    await supabase.auth.signOut();
    throw new AuthenticationError('This account is not authorized for the official portal');
  }

  // AUDIT: Records official email/password login — non-blocking for login speed
  void writeAuditLog({
    actorId: data.user.id,
    actorRole: role,
    action: 'OFFICIAL_LOGIN',
    details: { method: 'email_password' },
    ipAddress: getClientIp(req.headers),
  });

  const redirectTo = getRedirectForRole(role);

  clearCitizenSessionCookie(response);

  response.cookies.set('last_active', String(Date.now()), {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 1800,
  });

  if (wantsJson) {
    return toAuthJsonResponse(response, { redirectTo, role });
  }

  const redirectResponse = NextResponse.redirect(new URL(redirectTo, req.url));
  copyAuthCookies(response, redirectResponse);
  clearCitizenSessionCookie(redirectResponse);
  return redirectResponse;
});
