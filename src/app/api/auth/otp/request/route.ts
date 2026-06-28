import { cookies } from 'next/headers';
import { withErrorHandling } from '@/lib/errors';
import { ok } from '@/lib/api-response';
import { createServerClient } from '@/lib/supabase/client';
import { otpRequestSchema } from '@/lib/validations/approval';
import { ValidationError } from '@/lib/errors';

export const POST = withErrorHandling(async (req: Request) => {
  const body = otpRequestSchema.parse(await req.json());
  const supabase = createServerClient(cookies());

  const { error } = await supabase.auth.signInWithOtp({
    phone: `+91${body.phone}`,
  });

  if (error) throw new ValidationError(error.message);

  return ok({ message: 'OTP sent' });
});
