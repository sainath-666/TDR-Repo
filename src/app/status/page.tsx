import { PublicPageLayout } from '@/components/layout/PublicPageLayout';
import { PortalPageShell } from '@/components/layout/PortalPageShell';
import { StatusLookup } from '@/components/portal/StatusLookup';

export default function StatusPage() {
  return (
    <PublicPageLayout>
      <PortalPageShell title="TDR Application Status">
        <StatusLookup />
      </PortalPageShell>
    </PublicPageLayout>
  );
}
