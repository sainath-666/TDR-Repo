import { cookies } from 'next/headers';
import { withErrorHandling, AuthenticationError } from '@/lib/errors';
import { ok } from '@/lib/api-response';
import { getCurrentUser } from '@/lib/supabase/client';
import { getOfficialDashboardData } from '@/lib/queries/official-dashboard';

/** @deprecated Use GET /api/dashboard/official */
export const GET = withErrorHandling(async () => {
  const user = await getCurrentUser(cookies());
  if (!user) throw new AuthenticationError();
  if (user.role !== 'DEO' && user.role !== 'SURVEYOR') {
    throw new AuthenticationError('DEO or Surveyor access required');
  }

  const data = await getOfficialDashboardData(user);
  return ok({ bonds: data.bonds, stats: data.summary });
});
