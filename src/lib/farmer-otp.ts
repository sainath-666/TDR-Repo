import bcrypt from 'bcryptjs';
import { randomInt } from 'crypto';
import { prisma } from '@/lib/prisma';

export const FARMER_OTP_PURPOSE = 'FARMER_LOGIN';

/**
 * Demo citizen login: any 6-digit OTP is accepted (no SMS, no Supabase).
 */
export function isFarmerSmsDevBypass(): boolean {
  return true;
}

export async function issueFarmerLoginOtp(farmerId: string, phone: string): Promise<void> {
  // Demo mode: any 6-digit OTP is accepted — skip bcrypt + DB write
  if (isFarmerSmsDevBypass()) {
    return;
  }

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

  console.warn(`[DEV] Farmer login OTP for +91${phone}: ${otp}`);
}

export async function verifyFarmerLoginOtp(farmerId: string, otp: string): Promise<boolean> {
  if (!/^\d{6}$/.test(otp)) return false;

  // Demo mode: accept any 6 digits without bcrypt/DB
  if (isFarmerSmsDevBypass()) {
    return true;
  }

  const record = await prisma.otpRequest.findFirst({
    where: {
      userId: farmerId,
      purpose: FARMER_OTP_PURPOSE,
      used: false,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!record) return false;

  const valid = await bcrypt.compare(otp, record.otpHash);
  if (!valid) return false;

  await prisma.otpRequest.update({ where: { id: record.id }, data: { used: true } });
  return true;
}
