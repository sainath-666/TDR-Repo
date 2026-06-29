import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { FileText, Clock, CheckCircle2, XCircle, Plus, ArrowRight } from 'lucide-react';
import { getCurrentUser } from '@/lib/supabase/client';
import { prisma } from '@/lib/prisma';
import { BondStatus } from '@prisma/client';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { isPendingStatus } from '@/lib/bond-status';

export default async function DeoDashboardPage() {
  const user = await getCurrentUser(cookies());
  if (!user) redirect('/official-login');

  const bonds = await prisma.tdrBond.findMany({
    where: { createdBy: user.id },
    include: { holder: true, landDetails: true },
    orderBy: { updatedAt: 'desc' },
  });

  const stats = {
    total: bonds.length,
    pending: bonds.filter((b) => isPendingStatus(b.status)).length,
    approved: bonds.filter((b) => b.status === BondStatus.ACTIVE).length,
    rejected: bonds.filter((b) => b.status === BondStatus.REJECTED).length,
    drafts: bonds.filter((b) => b.status === BondStatus.DRAFT).length,
  };

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Offline TDR bond data entry — Capital City migration"
        breadcrumb="DEO Portal"
      >
        <Button href="/deo/bonds/new" size="md">
          <Plus className="h-4 w-4" />
          New Bond Entry
        </Button>
      </PageHeader>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Bonds" value={stats.total} icon={FileText} accent="primary" />
        <StatCard
          label="Pending Approval"
          value={stats.pending}
          icon={Clock}
          accent="amber"
          trend={
            stats.drafts > 0 ? `${stats.drafts} draft${stats.drafts > 1 ? 's' : ''}` : undefined
          }
        />
        <StatCard label="Approved" value={stats.approved} icon={CheckCircle2} accent="green" />
        <StatCard label="Rejected" value={stats.rejected} icon={XCircle} accent="red" />
      </div>

      <Card padding="none" className="overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <h2 className="font-semibold text-slate-800">Recent Bond Entries</h2>
            <p className="text-xs text-slate-500 mt-0.5">{bonds.length} total records</p>
          </div>
        </div>

        {bonds.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No bonds yet"
            description="Start your first TDR bond entry. The 3-phase form covers holder details, land surrender, and document upload."
            actionLabel="Create Bond Entry"
            actionHref="/deo/bonds/new"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>TDR Number</th>
                  <th>Holder</th>
                  <th>Survey No.</th>
                  <th>Area (Sq Yds)</th>
                  <th>Status</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {bonds.map((bond) => (
                  <tr key={bond.id}>
                    <td>
                      <span className="font-semibold text-apcrda-primary">{bond.tdrNumber}</span>
                    </td>
                    <td>{bond.holder?.name ?? '—'}</td>
                    <td className="font-mono text-xs">{bond.landDetails?.surveyNumber ?? '—'}</td>
                    <td>
                      {bond.landDetails
                        ? Number(bond.landDetails.surrenderedAreaSqYds).toLocaleString('en-IN')
                        : '—'}
                    </td>
                    <td>
                      <Badge status={bond.status} />
                    </td>
                    <td className="text-right">
                      {bond.status === BondStatus.DRAFT ? (
                        <Link
                          href={`/deo/bonds/new?bondId=${bond.id}`}
                          className="inline-flex items-center gap-1 text-sm font-medium text-apcrda-primary hover:text-apcrda-primary-light"
                        >
                          Resume
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      ) : (
                        <span className="text-xs text-slate-400">
                          {bond.updatedAt.toLocaleDateString('en-IN')}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
