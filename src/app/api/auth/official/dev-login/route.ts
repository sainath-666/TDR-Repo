import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { AuthenticationError, NotFoundError } from '@/lib/errors';
import { createAdminClient } from '@/lib/supabase/client';
import { prisma } from '@/lib/prisma';

const DEV_PASSWORD = 'DevPassword123!';

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

async function ensureOfficialAuthUser(
  official: {
    id: string;
    employeeId: string;
    name: string;
    role: string;
    districtCode: string;
  },
  email: string,
) {
  const admin = createAdminClient();
  const { data: existing } = await admin.auth.admin.getUserById(official.id);

  if (!existing.user) {
    const { error } = await admin.auth.admin.createUser({
      id: official.id,
      email,
      password: DEV_PASSWORD,
      email_confirm: true,
      user_metadata: { name: official.name },
      app_metadata: {
        role: official.role,
        district_code: official.districtCode,
        employee_id: official.employeeId,
      },
    });
    if (error) throw new AuthenticationError(error.message);
  } else {
    await admin.auth.admin.updateUserById(official.id, {
      app_metadata: {
        role: official.role,
        district_code: official.districtCode,
        employee_id: official.employeeId,
      },
    });
  }
}

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.redirect(
      new URL('/official-login?error=Dev+login+disabled+in+production', req.url),
    );
  }

  try {
    const employeeId = await parseEmployeeId(req);
    const official = await prisma.official.findUnique({ where: { employeeId } });
    if (!official) throw new NotFoundError('official', employeeId);

    const email = `${employeeId.toLowerCase()}@dev.apcrda.local`;
    await ensureOfficialAuthUser(official, email);

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
      email,
      password: DEV_PASSWORD,
    });

    if (signInError) {
      return NextResponse.redirect(
        new URL(`/official-login?error=${encodeURIComponent(signInError.message)}`, req.url),
      );
    }

    return response;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Login failed';
    return NextResponse.redirect(
      new URL(`/official-login?error=${encodeURIComponent(message)}`, req.url),
    );
  }
}
