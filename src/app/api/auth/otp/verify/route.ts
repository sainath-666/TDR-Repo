import { NextRequest, NextResponse } from 'next/server';
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
  });
  if (!farmer) throw new AuthenticationError('Phone number not registered');

  await ensureFarmerAuthUser(farmer);

  const response = createAuthJsonResponse({ userId: '', role: 'FARMER' as const });
  const supabase = createRouteHandlerClient(req, response);

  if (isFarmerSmsDevBypass()) {
    const valid = await verifyFarmerLoginOtp(farmer.id, body.otp);
    if (!valid) throw new AuthenticationError('Invalid OTP');

    const { data, error } = await supabase.auth.signInWithPassword({
      email: farmerDevEmail(farmer.aadhaarPhone),
      password: DEV_PASSWORD,
    });

    if (error || !data.user) {
      throw new AuthenticationError(error?.message ?? 'Login failed');
    }

    if (data.user.id !== farmer.id) {
      await syncFarmerAppMetadata(data.user.id, farmer.id);
    }

    await supabase.auth.refreshSession();

    // AUDIT: Records farmer OTP login (dev password session)
    await writeAuditLog({
      actorId: data.user.id,
      actorRole: 'FARMER',
      action: 'FARMER_LOGIN',
      details: { devBypass: true },
      ipAddress: getClientIp(req.headers),
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

  const { data, error } = await supabase.auth.verifyOtp({
    phone: `+91${body.phone}`,
    token: body.otp,
    type: 'sms',
  });

  if (error || !data.user) throw new AuthenticationError('Invalid OTP');

  if (data.user.id !== farmer.id) {
    await syncFarmerAppMetadata(data.user.id, farmer.id);
  } else {
    await ensureFarmerAuthUser(farmer);
  }

  await supabase.auth.refreshSession();

  // AUDIT: Records farmer OTP login
  await writeAuditLog({
    actorId: data.user.id,
    actorRole: 'FARMER',
    action: 'FARMER_LOGIN',
    ipAddress: getClientIp(req.headers),
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
