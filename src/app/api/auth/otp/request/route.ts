import { NextRequest } from 'next/server';
import { withErrorHandling, AuthenticationError } from '@/lib/errors';
import { prisma } from '@/lib/prisma';
import { writeAuditLog } from '@/lib/audit';
import { otpRequestSchema } from '@/lib/validations/approval';
import { getClientIp } from '@/lib/bond-helpers';
import { issueFarmerLoginOtp, isFarmerSmsDevBypass } from '@/lib/farmer-otp';
import { createAuthJsonResponse, createRouteHandlerClient } from '@/lib/supabase/route-handler';

export const POST = withErrorHandling(async (req: NextRequest) => {
  const body = otpRequestSchema.parse(await req.json());

  const farmer = await prisma.farmer.findFirst({
    where: { aadhaarPhone: body.phone },
    select: { id: true },
  });
  if (!farmer) {
    throw new AuthenticationError('This mobile number is not registered with APCRDA');
  }

  if (isFarmerSmsDevBypass()) {
    // Demo: no Supabase admin, no bcrypt — just confirm the phone is registered
    // AUDIT: Records farmer OTP request (demo bypass) — non-blocking for login speed
    void writeAuditLog({
      actorId: farmer.id,
      actorRole: 'FARMER',
      action: 'FARMER_OTP_REQUESTED',
      details: { phone: body.phone.slice(-4), devBypass: true },
      ipAddress: getClientIp(req.headers),
    });

    return createAuthJsonResponse({
      message: 'OTP sent',
      devMode: true,
      hint: 'Demo: use any 6-digit OTP (e.g. 123456).',
    });
  }

  await issueFarmerLoginOtp(farmer.id, body.phone);

  const response = createAuthJsonResponse({ message: 'OTP sent' });
  const supabase = createRouteHandlerClient(req, response);

  const { error } = await supabase.auth.signInWithOtp({
    phone: `+91${body.phone}`,
    options: { shouldCreateUser: false },
  });

  if (error) throw new AuthenticationError(error.message);

  void writeAuditLog({
    actorId: farmer.id,
    actorRole: 'FARMER',
    action: 'FARMER_OTP_REQUESTED',
    ipAddress: getClientIp(req.headers),
  });

  return response;
});
