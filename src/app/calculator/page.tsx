import { PublicPageLayout } from '@/components/layout/PublicPageLayout';
import { PortalPageShell } from '@/components/layout/PortalPageShell';
import { TdrCalculator } from '@/components/portal/TdrCalculator';

export default function CalculatorPage() {
  return (
    <PublicPageLayout>
      <PortalPageShell title="TDR Area Calculator">
        <TdrCalculator />
      </PortalPageShell>
    </PublicPageLayout>
  );
}
