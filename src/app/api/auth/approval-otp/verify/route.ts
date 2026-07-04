import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { withErrorHandling, AuthenticationError } from '@/lib/errors';
import { ok } from '@/lib/api-response';
import { getCurrentUser } from '@/lib/supabase/client';
import { prisma } from '@/lib/prisma';
import { writeAuditLog } from '@/lib/audit';
import { approvalOtpVerifySchema } from '@/lib/validations/approval';
import { getClientIp } from '@/lib/bond-helpers';
import { isOfficialRole } from '@/types';

export const POST = withErrorHandling(async (req: NextRequest) => {
  const user = await getCurrentUser();
  if (!user || !isOfficialRole(user.role)) throw new AuthenticationError();

  const body = approvalOtpVerifySchema.parse(await req.json());

  const otpRecord = await prisma.otpRequest.findFirst({
    where: {
      userId: user.id,
      purpose: body.purpose,
      used: false,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!otpRecord && process.env.NODE_ENV === 'production' && process.env.AUTH_DEV_MODE !== 'true') {
    throw new AuthenticationError('OTP expired or not found');
  }

  if (process.env.NODE_ENV !== 'production' || process.env.AUTH_DEV_MODE === 'true') {
    if (!/^\d{6}$/.test(body.otp)) {
      throw new AuthenticationError('Enter any 6-digit OTP in development');
    }
  } else {
    const valid = await bcrypt.compare(body.otp, otpRecord!.otpHash);
    if (!valid) throw new AuthenticationError('Invalid OTP');
    await prisma.otpRequest.update({
      where: { id: otpRecord!.id },
      data: { used: true },
    });
  }

  await writeAuditLog({
    actorId: user.id,
    actorRole: user.role,
    action: 'APPROVAL_OTP_VERIFIED',
    details: { purpose: body.purpose },
    ipAddress: getClientIp(req.headers),
  });

  return ok({ verified: true });
});
