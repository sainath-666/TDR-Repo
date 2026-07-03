import { z } from 'zod';

export const approveSchema = z.object({
  remarks: z.string().optional(),
});

export const rejectSchema = z.object({
  remarks: z.string().min(10, 'Rejection reason must be at least 10 characters'),
});

export const returnSchema = z.object({
  remarks: z.string().min(10, 'Return reason must be at least 10 characters'),
});

export const approvalOtpRequestSchema = z.object({
  purpose: z.enum(['APPROVAL', 'DOWNLOAD']).default('APPROVAL'),
});

export const approvalOtpVerifySchema = z.object({
  otp: z.string().regex(/^\d{6}$/, 'OTP must be 6 digits'),
  purpose: z.enum(['APPROVAL', 'DOWNLOAD']).default('APPROVAL'),
});

export const otpRequestSchema = z.object({
  phone: z.string().regex(/^\d{10}$/, 'Phone must be 10 digits'),
});

export const otpVerifySchema = z.object({
  phone: z.string().regex(/^\d{10}$/, 'Phone must be 10 digits'),
  otp: z.string().regex(/^\d{6}$/, 'OTP must be 6 digits'),
});
