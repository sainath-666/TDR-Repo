import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { randomInt } from 'crypto';
import { withErrorHandling, AuthenticationError } from '@/lib/errors';
import { ok } from '@/lib/api-response';
import { getCurrentUser } from '@/lib/supabase/client';
import { prisma } from '@/lib/prisma';
import { writeAuditLog } from '@/lib/audit';
import { approvalOtpRequestSchema } from '@/lib/validations/approval';
import { getClientIp } from '@/lib/bond-helpers';
import { isOfficialRole } from '@/types';

export const POST = withErrorHandling(async (req: NextRequest) => {
  const user = await getCurrentUser(cookies());
  if (!user || !isOfficialRole(user.role)) throw new AuthenticationError();

  const body = approvalOtpRequestSchema.parse(await req.json());
  const otp = String(randomInt(100000, 999999));
  const otpHash = await bcrypt.hash(otp, 10);

  await prisma.otpRequest.create({
    data: {
      userId: user.id,
      purpose: body.purpose,
      otpHash,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    },
  });

  if (process.env.NODE_ENV === 'development') {
    console.warn(`[DEV] Approval OTP for ${user.employeeId ?? user.id}: ${otp}`);
  }

  await writeAuditLog({
    actorId: user.id,
    actorRole: user.role,
    action: 'APPROVAL_OTP_REQUESTED',
    details: { purpose: body.purpose },
    ipAddress: getClientIp(req.headers),
  });

  return ok({ message: 'OTP sent to registered phone' });
});
