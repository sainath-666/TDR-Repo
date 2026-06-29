import { BondEntryForm } from '@/components/bond-form/BondEntryForm';
import { PageHeader } from '@/components/ui/PageHeader';

export default function NewBondPage() {
  return (
    <>
      <PageHeader
        title="New TDR Bond Entry"
        description="Phase 1: Holder details · Phase 2: Land surrender · Phase 3: Documents"
      />
      <div className="max-w-4xl">
        <BondEntryForm />
      </div>
    </>
  );
}
