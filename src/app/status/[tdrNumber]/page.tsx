import { PublicPageLayout } from '@/components/layout/PublicPageLayout';
import { StatusResult } from '@/components/portal/StatusResult';
import { getBondStatusByTdrNumber } from '@/lib/portal-status';

export default async function StatusResultPage({ params }: { params: { tdrNumber: string } }) {
  const tdrNumber = decodeURIComponent(params.tdrNumber).trim();
  const result = await getBondStatusByTdrNumber(tdrNumber);

  return (
    <PublicPageLayout>
      <StatusResult result={result} />
    </PublicPageLayout>
  );
}
