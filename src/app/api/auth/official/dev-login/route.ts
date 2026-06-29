import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { AuthenticationError, NotFoundError } from '@/lib/errors';
import { prisma } from '@/lib/prisma';
import { DEV_PASSWORD, ensureOfficialAuthUser, officialDevEmail } from '@/lib/supabase/auth-users';

function getRedirectForRole(role: string): string {
  return role === 'DEO' || role === 'SURVEYOR' ? '/deo/dashboard' : '/official/queue';
}

async function parseEmployeeId(req: NextRequest): Promise<string> {
  const contentType = req.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    const body = (await req.json()) as { employeeId?: string };
    if (!body.employeeId) throw new AuthenticationError('employeeId is required');
    return body.employeeId;
  }
  const form = await req.formData();
  const id = form.get('employeeId');
  if (typeof id !== 'string' || !id) throw new AuthenticationError('employeeId is required');
  return id;
}

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === 'production' && process.env.AUTH_DEV_MODE !== 'true') {
    return NextResponse.redirect(
      new URL('/official-login?error=Dev+login+disabled+in+production', req.url),
    );
  }

  try {
    const employeeId = await parseEmployeeId(req);
    const official = await prisma.official.findUnique({ where: { employeeId } });
    if (!official) throw new NotFoundError('official', employeeId);

    await ensureOfficialAuthUser(official);

    const redirectTo = getRedirectForRole(official.role);
    let response = NextResponse.redirect(new URL(redirectTo, req.url));

    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
              response.cookies.set(name, value, options);
            });
          },
        },
      },
    );

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: officialDevEmail(official.employeeId),
      password: DEV_PASSWORD,
    });

    if (signInError) {
      return NextResponse.redirect(
        new URL(`/official-login?error=${encodeURIComponent(signInError.message)}`, req.url),
      );
    }

    response.cookies.set('last_active', String(Date.now()), {
      httpOnly: true,
      sameSite: 'strict',
      path: '/',
      maxAge: 1800,
    });

    return response;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Login failed';
    return NextResponse.redirect(
      new URL(`/official-login?error=${encodeURIComponent(message)}`, req.url),
    );
  }
}
