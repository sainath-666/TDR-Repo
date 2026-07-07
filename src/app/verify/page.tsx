import { redirect } from 'next/navigation';
import { PublicPageLayout } from '@/components/layout/PublicPageLayout';
import { VerifyEntitlementList } from '@/components/portal/VerifyEntitlementList';
import { fetchAppApi } from '@/lib/server-api';
import type { PublicBondSummary } from '@/lib/portal-stats';

export default async function VerifySearchPage({ searchParams }: { searchParams: { q?: string } }) {
  const query = searchParams.q?.trim();
  if (query) {
    redirect(`/verify/${encodeURIComponent(query)}`);
  }

  const entries = await fetchAppApi<PublicBondSummary[]>(
    '/api/portal/public?resource=entitlements&limit=100',
  );

  return (
    <PublicPageLayout>
      <VerifyEntitlementList entries={entries} />
    </PublicPageLayout>
  );
}
