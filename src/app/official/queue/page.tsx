import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ClipboardList, CheckCircle2, XCircle, ArrowRight, Clock, MapPin } from 'lucide-react';
import { getCurrentUser } from '@/lib/supabase/client';
import { prisma } from '@/lib/prisma';
import { BondStatus } from '@prisma/client';
import { getQueueStatusForRole } from '@/types';
import { formatRole } from '@/lib/role-labels';
import { formatBondStatus } from '@/lib/bond-status';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';

export default async function OfficialQueuePage() {
  const user = await getCurrentUser(cookies());
  if (!user) redirect('/official-login');

  const queueStatus = getQueueStatusForRole(user.role);
  const districtFilter = user.districtCode ? { district: user.districtCode } : undefined;

  const where =
    user.role === 'COMMISSIONER' || user.role === 'ADDL_COMMISSIONER'
      ? { status: BondStatus.PENDING_L4 }
      : {
          status: queueStatus ?? undefined,
          holder: districtFilter,
        };

  const [bonds, activeCount, rejectedCount] = await Promise.all([
    prisma.tdrBond.findMany({
      where,
      include: { holder: true, landDetails: true, farmer: true },
      orderBy: { updatedAt: 'asc' },
    }),
    prisma.tdrBond.count({
      where: { status: BondStatus.ACTIVE, holder: districtFilter },
    }),
    prisma.tdrBond.count({
      where: { status: BondStatus.REJECTED, holder: districtFilter },
    }),
  ]);

  const queueLabel = queueStatus ? formatBondStatus(queueStatus) : 'All Pending';

  return (
    <>
      <PageHeader
        title="Approval Queue"
        description={`${formatRole(user.role)}${user.districtCode ? ` · ${user.districtCode} district` : ''}`}
        breadcrumb="Official Portal"
      >
        <div className="flex items-center gap-2 rounded-full bg-apcrda-secondary/10 px-4 py-2 ring-1 ring-apcrda-secondary/20">
          <Clock className="h-4 w-4 text-apcrda-secondary" />
          <span className="text-sm font-semibold text-apcrda-primary">
            {bonds.length} awaiting review
          </span>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard
          label="In Queue"
          value={bonds.length}
          icon={ClipboardList}
          accent="amber"
          trend={queueLabel}
        />
        <StatCard label="Active Bonds" value={activeCount} icon={CheckCircle2} accent="green" />
        <StatCard label="Rejected" value={rejectedCount} icon={XCircle} accent="red" />
      </div>

      <Card padding="none" className="overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-apcrda-primary/5 to-transparent">
          <h2 className="font-semibold text-slate-800">Bonds Pending Your Action</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            5-level approval chain · L1 Tahsildar → L2 SDC → L3 Director → L4 Commissioner
          </p>
        </div>

        {bonds.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="Queue is clear"
            description="No bonds are currently awaiting your approval. New submissions will appear here automatically."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>TDR Number</th>
                  <th>Farmer</th>
                  <th>Location</th>
                  <th>Survey</th>
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
                    <td>{bond.farmer.name}</td>
                    <td>
                      <span className="inline-flex items-center gap-1 text-slate-600">
                        <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                        {bond.holder?.village ?? '—'}
                      </span>
                    </td>
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
                      <Button
                        href={`/official/bonds/${bond.id}/review`}
                        variant="outline"
                        size="sm"
                      >
                        Review
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
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
