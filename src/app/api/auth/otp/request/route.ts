import { NextRequest } from 'next/server';
import { withErrorHandling, AuthenticationError } from '@/lib/errors';
import { prisma } from '@/lib/prisma';
import { otpRequestSchema } from '@/lib/validations/approval';
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

  const response = createAuthJsonResponse({ message: 'OTP sent' });
  const supabase = createRouteHandlerClient(req, response);

  const { error } = await supabase.auth.signInWithOtp({
    phone: `+91${body.phone}`,
    options: { shouldCreateUser: false },
  });

  if (error) throw new AuthenticationError(error.message);

  return response;
});
