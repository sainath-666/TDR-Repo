import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NotFoundError } from '@/lib/errors';
import { prisma } from '@/lib/prisma';
import { DEV_PASSWORD, ensureFarmerAuthUser } from '@/lib/supabase/auth-users';

/**
 * Dev-only farmer login (password) when SMS OTP is not configured.
 * Uses the same Supabase users provisioned by auth:sync.
 */
export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === 'production' && process.env.AUTH_DEV_MODE !== 'true') {
    return NextResponse.redirect(
      new URL('/farmer-login?error=Dev+login+disabled+in+production', req.url),
    );
  }

  try {
    const form = await req.formData();
    const phone = form.get('phone');
    if (typeof phone !== 'string' || !/^\d{10}$/.test(phone)) {
      return NextResponse.redirect(new URL('/farmer-login?error=Invalid+phone+number', req.url));
    }

    const farmer = await prisma.farmer.findFirst({ where: { aadhaarPhone: phone } });
    if (!farmer) throw new NotFoundError('farmer', phone);

    await ensureFarmerAuthUser(farmer);

    let response = NextResponse.redirect(new URL('/farmer/dashboard', req.url));
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

    // Farmers provisioned via admin API can sign in with email alias in dev
    const devEmail = `farmer-${phone}@dev.apcrda.local`;
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: devEmail,
      password: DEV_PASSWORD,
    });

    if (signInError) {
      return NextResponse.redirect(
        new URL(`/farmer-login?error=${encodeURIComponent(signInError.message)}`, req.url),
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
      new URL(`/farmer-login?error=${encodeURIComponent(message)}`, req.url),
    );
  }
}
