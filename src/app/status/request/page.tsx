import { PublicPageLayout } from '@/components/layout/PublicPageLayout';
import { StatusRequestForm } from '@/components/portal/StatusRequestForm';

export default function StatusRequestPage({
  searchParams,
}: {
  searchParams: { tdrNumber?: string };
}) {
  return (
    <PublicPageLayout>
      <StatusRequestForm initialTdrNumber={searchParams.tdrNumber ?? ''} />
    </PublicPageLayout>
  );
}
