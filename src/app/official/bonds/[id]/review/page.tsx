import { cookies } from 'next/headers';
import { redirect, notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { getCurrentUser } from '@/lib/supabase/client';
import { getBondWithRelations } from '@/lib/bond-helpers';
import { buildBondReviewDisplay } from '@/lib/bond-review-display';
import { canActOnBondReview } from '@/lib/bond-review-access';
import { BondReviewPanel } from '@/components/approval/BondReviewPanel';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

export default async function BondReviewPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser(cookies());
  if (!user) redirect('/official-login');

  try {
    const bond = await getBondWithRelations(params.id);
    const reviewDisplay = buildBondReviewDisplay(bond);
    return (
      <div className="w-full px-4 py-5 sm:px-6">
        <div className="mb-5 flex flex-wrap items-center gap-3 rounded-xl border border-slate-200/80 bg-white px-4 py-3 shadow-sm">
          <Button href="/official/dashboard" variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div className="h-5 w-px bg-slate-200 hidden sm:block" />
          <h1 className="text-lg font-bold text-apcrda-primary">{bond.tdrNumber}</h1>
          <Badge status={bond.status} size="sm" />
          <p className="w-full sm:w-auto sm:ml-auto text-xs text-slate-500">
            Approval review · 5-stage pipeline
          </p>
        </div>
        <BondReviewPanel
          bond={bond}
          userRole={user.role}
          reviewDisplay={reviewDisplay}
          canAct={canActOnBondReview(user.role, bond.status)}
        />
      </div>
    );
  } catch {
    notFound();
  }
}
