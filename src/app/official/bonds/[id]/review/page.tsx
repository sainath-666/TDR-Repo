import { cookies } from 'next/headers';
import { redirect, notFound } from 'next/navigation';
import { getCurrentUser } from '@/lib/supabase/client';
import { getBondWithRelations } from '@/lib/bond-helpers';
import { BondReviewPanel } from '@/components/approval/BondReviewPanel';

export default async function BondReviewPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser(cookies());
  if (!user) redirect('/official-login');

  try {
    const bond = await getBondWithRelations(params.id);
    return (
      <main className="min-h-screen p-6 max-w-4xl mx-auto">
        <BondReviewPanel bond={bond} userRole={user.role} />
      </main>
    );
  } catch {
    notFound();
  }
}
