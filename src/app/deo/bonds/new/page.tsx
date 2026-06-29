import { cookies } from 'next/headers';
import { BondEntryForm } from '@/components/bond-form/BondEntryForm';
import { PageHeader } from '@/components/ui/PageHeader';
import { getCurrentUser } from '@/lib/supabase/client';

export default async function NewBondPage() {
  const user = await getCurrentUser(cookies());

  return (
    <>
      <PageHeader
        title="New TDR Bond Entry"
        description="Phase 1: Holder details · Phase 2: Land surrender · Phase 3: Documents"
      />
      <div className="max-w-4xl">
        <BondEntryForm officialDistrictCode={user?.districtCode} />
      </div>
    </>
  );
}
