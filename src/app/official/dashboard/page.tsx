import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/supabase/client';
import { formatRole } from '@/lib/role-labels';
import { getOfficialDashboardData } from '@/lib/queries/official-dashboard';
import { OfficialDashboardView } from '@/components/dashboard/OfficialDashboardView';

export const dynamic = 'force-dynamic';

export default async function OfficialDashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/official-login');

  const data = await getOfficialDashboardData(user);

  return <OfficialDashboardView data={data} portal="official" roleLabel={formatRole(user.role)} />;
}
