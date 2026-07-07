import { PublicPageLayout } from '@/components/layout/PublicPageLayout';
import { TdrBankList } from '@/components/portal/TdrBankList';
import { fetchAppApi } from '@/lib/server-api';
import type { TdrBankEntry } from '@/lib/portal-stats';

export default async function TdrBankPage() {
  const entries = await fetchAppApi<TdrBankEntry[]>('/api/portal/public?resource=tdr-bank');

  return (
    <PublicPageLayout>
      <TdrBankList entries={entries} />
    </PublicPageLayout>
  );
}
