import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { withErrorHandling, AuthenticationError } from '@/lib/errors';
import { ok } from '@/lib/api-response';
import { createServerClient } from '@/lib/supabase/client';
import { prisma } from '@/lib/prisma';
import { writeAuditLog } from '@/lib/audit';
import { otpVerifySchema } from '@/lib/validations/approval';
import { getClientIp } from '@/lib/bond-helpers';

export const POST = withErrorHandling(async (req: NextRequest) => {
  const body = otpVerifySchema.parse(await req.json());
  const supabase = createServerClient(cookies());

  const { data, error } = await supabase.auth.verifyOtp({
    phone: `+91${body.phone}`,
    token: body.otp,
    type: 'sms',
  });

  if (error || !data.user) throw new AuthenticationError('Invalid OTP');

  const farmer = await prisma.farmer.findFirst({
    where: { aadhaarPhone: body.phone },
  });

  if (farmer && farmer.id !== data.user.id) {
    await prisma.farmer.update({
      where: { id: farmer.id },
      data: { id: data.user.id },
    });
  }

  // AUDIT: Records farmer OTP login
  await writeAuditLog({
    actorId: data.user.id,
    actorRole: 'FARMER',
    action: 'FARMER_LOGIN',
    ipAddress: getClientIp(req.headers),
  });

  return ok({ userId: data.user.id, role: 'FARMER' });
});
