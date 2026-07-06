import { NextRequest } from 'next/server';
import { withErrorHandling, AuthenticationError } from '@/lib/errors';
import { prisma } from '@/lib/prisma';
import { writeAuditLog } from '@/lib/audit';
import { otpRequestSchema } from '@/lib/validations/approval';
import { getClientIp } from '@/lib/bond-helpers';
import { createAuthJsonResponse } from '@/lib/supabase/route-handler';

export const POST = withErrorHandling(async (req: NextRequest) => {
  const body = otpRequestSchema.parse(await req.json());

  const farmer = await prisma.farmer.findFirst({
    where: { aadhaarPhone: body.phone },
    select: { id: true },
  });
  if (!farmer) {
    throw new AuthenticationError('No TDR exists linked to this phone number');
  }

  void writeAuditLog({
    actorId: farmer.id,
    actorRole: 'FARMER',
    action: 'FARMER_OTP_REQUESTED',
    details: { phone: body.phone.slice(-4), demo: true },
    ipAddress: getClientIp(req.headers),
  });

  return createAuthJsonResponse({
    message: 'OTP sent',
    devMode: true,
    hint: 'Demo: use any 6-digit OTP (e.g. 123456).',
  });
});
