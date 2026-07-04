import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/supabase/client';
import { PortalShell } from '@/components/layout/PortalShell';

export default async function DeoLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect('/official-login');

  return (
    <PortalShell
      portal="deo"
      role={user.role}
      userName={user.name}
      districtCode={user.districtCode}
    >
      {children}
    </PortalShell>
  );
}
