import { NextRequest } from 'next/server';
import { withErrorHandling, AuthenticationError } from '@/lib/errors';
import { prisma } from '@/lib/prisma';
import { writeAuditLog } from '@/lib/audit';
import { otpVerifySchema } from '@/lib/validations/approval';
import { getClientIp } from '@/lib/bond-helpers';
import { isFarmerSmsDevBypass, verifyFarmerLoginOtp } from '@/lib/farmer-otp';
import {
  DEV_PASSWORD,
  ensureFarmerAuthUser,
  farmerDevEmail,
  syncFarmerAppMetadata,
} from '@/lib/supabase/auth-users';
import {
  createAuthJsonResponse,
  createRouteHandlerClient,
  toAuthJsonResponse,
} from '@/lib/supabase/route-handler';

export const POST = withErrorHandling(async (req: NextRequest) => {
  const body = otpVerifySchema.parse(await req.json());

  const farmer = await prisma.farmer.findFirst({
    where: { aadhaarPhone: body.phone },
    select: { id: true, name: true, aadhaarPhone: true },
  });
  if (!farmer) throw new AuthenticationError('Phone number not registered');

  const response = createAuthJsonResponse({ userId: '', role: 'FARMER' as const });
  const supabase = createRouteHandlerClient(req, response);
  const ipAddress = getClientIp(req.headers);

  if (isFarmerSmsDevBypass()) {
    const valid = await verifyFarmerLoginOtp(farmer.id, body.otp);
    if (!valid) throw new AuthenticationError('Invalid OTP');

    // Happy path: sign in only (no admin API). Provision only if credentials missing.
    let { data, error } = await supabase.auth.signInWithPassword({
      email: farmerDevEmail(farmer.aadhaarPhone),
      password: DEV_PASSWORD,
    });

    if (error || !data.user) {
      await ensureFarmerAuthUser(farmer);
      const retry = await supabase.auth.signInWithPassword({
        email: farmerDevEmail(farmer.aadhaarPhone),
        password: DEV_PASSWORD,
      });
      data = retry.data;
      error = retry.error;
    }

    if (error || !data.user) {
      throw new AuthenticationError(error?.message ?? 'Login failed');
    }

    const meta = data.user.app_metadata as Record<string, unknown>;
    if (data.user.id !== farmer.id || meta.farmer_id !== farmer.id) {
      await syncFarmerAppMetadata(data.user.id, farmer.id);
    }

    // AUDIT: Records farmer OTP login (demo) — non-blocking
    void writeAuditLog({
      actorId: data.user.id,
      actorRole: 'FARMER',
      action: 'FARMER_LOGIN',
      details: { devBypass: true },
      ipAddress,
    });

    response.cookies.set('last_active', String(Date.now()), {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 1800,
    });

    return toAuthJsonResponse(response, {
      userId: data.user.id,
      role: 'FARMER' as const,
    });
  }

  await ensureFarmerAuthUser(farmer);

  const { data, error } = await supabase.auth.verifyOtp({
    phone: `+91${body.phone}`,
    token: body.otp,
    type: 'sms',
  });

  if (error || !data.user) throw new AuthenticationError('Invalid OTP');

  if (data.user.id !== farmer.id) {
    await syncFarmerAppMetadata(data.user.id, farmer.id);
  }

  void writeAuditLog({
    actorId: data.user.id,
    actorRole: 'FARMER',
    action: 'FARMER_LOGIN',
    ipAddress,
  });

  response.cookies.set('last_active', String(Date.now()), {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 1800,
  });

  return toAuthJsonResponse(response, {
    userId: data.user.id,
    role: 'FARMER' as const,
  });
});
