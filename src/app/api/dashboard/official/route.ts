import { cookies } from 'next/headers';
import { withErrorHandling, AuthenticationError } from '@/lib/errors';
import { ok } from '@/lib/api-response';
import { getCurrentUser } from '@/lib/supabase/client';
import { getOfficialDashboardData } from '@/lib/queries/official-dashboard';
import { getGovApprovalLevel } from '@/lib/approval-levels';

export const GET = withErrorHandling(async () => {
  const user = await getCurrentUser(cookies());
  if (!user) throw new AuthenticationError();

  const govLevel = getGovApprovalLevel(user.role);
  if (!govLevel) throw new AuthenticationError('Official dashboard not available for this role');

  const data = await getOfficialDashboardData(user);
  return ok(data);
});
