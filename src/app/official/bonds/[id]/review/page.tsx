import { cookies } from 'next/headers';
import { redirect, notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { getCurrentUser } from '@/lib/supabase/client';
import { getBondWithRelations } from '@/lib/bond-helpers';
import { BondReviewPanel } from '@/components/approval/BondReviewPanel';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

export default async function BondReviewPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser(cookies());
  if (!user) redirect('/official-login');

  try {
    const bond = await getBondWithRelations(params.id);
    return (
      <div className="max-w-4xl animate-fade-in">
        <div className="flex items-center gap-4 mb-6">
          <Button href="/official/queue" variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
            Back to queue
          </Button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold text-apcrda-primary truncate">{bond.tdrNumber}</h1>
              <Badge status={bond.status} size="md" />
            </div>
          </div>
        </div>
        <BondReviewPanel bond={bond} userRole={user.role} />
      </div>
    );
  } catch {
    notFound();
  }
}
