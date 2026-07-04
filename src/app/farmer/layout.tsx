import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/supabase/client';
import { PortalShell } from '@/components/layout/PortalShell';

export default async function FarmerLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect('/farmer-login');

  return (
    <PortalShell
      portal="farmer"
      role="FARMER"
      userName={user.name}
      districtCode={user.districtCode}
    >
      {children}
    </PortalShell>
  );
}
