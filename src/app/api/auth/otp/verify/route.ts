import { NextRequest } from 'next/server';
import { withErrorHandling, AuthenticationError } from '@/lib/errors';
import { prisma } from '@/lib/prisma';
import { writeAuditLog } from '@/lib/audit';
import { otpVerifySchema } from '@/lib/validations/approval';
import { getClientIp } from '@/lib/bond-helpers';
import { verifyFarmerLoginOtp } from '@/lib/farmer-otp';
import { setCitizenSessionCookie, clearCitizenSessionCookie } from '@/lib/citizen-session';
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
  if (!farmer) throw new AuthenticationError('No TDR exists linked to this phone number');

  const valid = await verifyFarmerLoginOtp(farmer.id, body.otp);
  if (!valid) throw new AuthenticationError('Invalid OTP');

  const response = createAuthJsonResponse({ userId: farmer.id, role: 'FARMER' as const });
  const supabase = createRouteHandlerClient(req, response);
  await supabase.auth.signOut();
  clearCitizenSessionCookie(response);
  await setCitizenSessionCookie(response, farmer);

  void writeAuditLog({
    actorId: farmer.id,
    actorRole: 'FARMER',
    action: 'FARMER_LOGIN',
    details: { demo: true },
    ipAddress: getClientIp(req.headers),
  });

  response.cookies.set('last_active', String(Date.now()), {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 1800,
  });

  return toAuthJsonResponse(response, {
    userId: farmer.id,
    role: 'FARMER' as const,
  });
});
