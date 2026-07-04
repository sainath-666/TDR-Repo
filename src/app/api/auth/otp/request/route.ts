import { NextRequest } from 'next/server';
import { withErrorHandling, AuthenticationError } from '@/lib/errors';
import { prisma } from '@/lib/prisma';
import { writeAuditLog } from '@/lib/audit';
import { otpRequestSchema } from '@/lib/validations/approval';
import { getClientIp } from '@/lib/bond-helpers';
import { issueFarmerLoginOtp, isFarmerSmsDevBypass } from '@/lib/farmer-otp';
import { ensureFarmerAuthUser } from '@/lib/supabase/auth-users';
import { createAuthJsonResponse, createRouteHandlerClient } from '@/lib/supabase/route-handler';

export const POST = withErrorHandling(async (req: NextRequest) => {
  const body = otpRequestSchema.parse(await req.json());

  const farmer = await prisma.farmer.findFirst({
    where: { aadhaarPhone: body.phone },
  });
  if (!farmer) {
    throw new AuthenticationError('This mobile number is not registered with APCRDA');
  }

  await ensureFarmerAuthUser(farmer);

  if (isFarmerSmsDevBypass()) {
    await issueFarmerLoginOtp(farmer.id, body.phone);

    // AUDIT: Records farmer OTP request (dev / offline SMS bypass)
    await writeAuditLog({
      actorId: farmer.id,
      actorRole: 'FARMER',
      action: 'FARMER_OTP_REQUESTED',
      details: { phone: body.phone.slice(-4), devBypass: true },
      ipAddress: getClientIp(req.headers),
    });

    return createAuthJsonResponse({
      message: 'OTP sent',
      devMode: true,
      hint: 'Demo: use any 6-digit OTP (e.g. 123456) or check the server console for the code.',
    });
  }

  const response = createAuthJsonResponse({ message: 'OTP sent' });
  const supabase = createRouteHandlerClient(req, response);

  const { error } = await supabase.auth.signInWithOtp({
    phone: `+91${body.phone}`,
    options: { shouldCreateUser: false },
  });

  if (error) throw new AuthenticationError(error.message);

  await writeAuditLog({
    actorId: farmer.id,
    actorRole: 'FARMER',
    action: 'FARMER_OTP_REQUESTED',
    ipAddress: getClientIp(req.headers),
  });

  return response;
});
