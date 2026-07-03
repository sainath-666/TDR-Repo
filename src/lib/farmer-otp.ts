import bcrypt from 'bcryptjs';
import { randomInt } from 'crypto';
import { prisma } from '@/lib/prisma';

export const FARMER_OTP_PURPOSE = 'FARMER_LOGIN';

/** True when Supabase SMS is not required (local dev / AUTH_DEV_MODE). */
export function isFarmerSmsDevBypass(): boolean {
  return process.env.NODE_ENV !== 'production' || process.env.AUTH_DEV_MODE === 'true';
}

export async function issueFarmerLoginOtp(farmerId: string, phone: string): Promise<void> {
  const otp = String(randomInt(100000, 999999));
  const otpHash = await bcrypt.hash(otp, 10);

  await prisma.otpRequest.create({
    data: {
      userId: farmerId,
      purpose: FARMER_OTP_PURPOSE,
      otpHash,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    },
  });

  if (isFarmerSmsDevBypass()) {
    console.warn(`[DEV] Farmer login OTP for +91${phone}: ${otp} (any 6 digits also accepted)`);
  }
}

export async function verifyFarmerLoginOtp(farmerId: string, otp: string): Promise<boolean> {
  if (!/^\d{6}$/.test(otp)) return false;

  const record = await prisma.otpRequest.findFirst({
    where: {
      userId: farmerId,
      purpose: FARMER_OTP_PURPOSE,
      used: false,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (record) {
    const valid = await bcrypt.compare(otp, record.otpHash);
    if (valid) {
      await prisma.otpRequest.update({ where: { id: record.id }, data: { used: true } });
      return true;
    }
  }

  // Development fallback when Supabase SMS provider is not configured
  return isFarmerSmsDevBypass();
}
