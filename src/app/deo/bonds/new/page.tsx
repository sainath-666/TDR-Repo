import { BondEntryForm } from '@/components/bond-form/BondEntryForm';

export default function NewBondPage() {
  return (
    <main className="min-h-screen p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-apcrda-primary mb-6">New TDR Bond Entry</h1>
      <BondEntryForm />
    </main>
  );
}
