import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/supabase/client';
import { fetchAppApi } from '@/lib/server-api';
import { formatRole } from '@/lib/role-labels';
import type { OfficialDashboardData } from '@/lib/queries/official-dashboard';
import { OfficialDashboardView } from '@/components/dashboard/OfficialDashboardView';

export const dynamic = 'force-dynamic';

export default async function DeoDashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/official-login');

  const cookieHeader = cookies()
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join('; ');

  const data = await fetchAppApi<OfficialDashboardData>('/api/dashboard/official', {
    headers: { cookie: cookieHeader },
  });

  return <OfficialDashboardView data={data} portal="deo" roleLabel={formatRole(user.role)} />;
}
