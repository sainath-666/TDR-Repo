import { redirect } from 'next/navigation';
import { Award, CheckCircle2, Clock, Download, FileText, MapPin, Ruler } from 'lucide-react';
import { getCurrentUser } from '@/lib/supabase/client';
import { prisma } from '@/lib/prisma';
import { BondStatus } from '@prisma/client';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { BondStatusTracker } from '@/components/farmer/BondStatusTracker';
import { BOND_STATUS_LABELS } from '@/lib/bond-status';

const PENDING_STATUSES: BondStatus[] = [
  BondStatus.DRAFT,
  BondStatus.PENDING_L1,
  BondStatus.PENDING_L2,
  BondStatus.PENDING_L3,
  BondStatus.PENDING_L4,
];

function statusRank(status: BondStatus): number {
  if (status === BondStatus.ACTIVE) return 0;
  if (PENDING_STATUSES.includes(status)) return 1;
  return 2;
}

export default async function FarmerDashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/farmer-login');

  const farmerId = user.farmerId ?? user.id;
  const bonds = await prisma.tdrBond.findMany({
    where: { farmerId },
    select: {
      id: true,
      tdrNumber: true,
      status: true,
      updatedAt: true,
      holder: { select: { name: true } },
      landDetails: {
        select: {
          surrenderedVillage: true,
          surveyNumber: true,
          tdrIssuedExtentSqYds: true,
        },
      },
    },
    orderBy: { updatedAt: 'desc' },
  });

  const sorted = [...bonds].sort((a, b) => {
    const rank = statusRank(a.status) - statusRank(b.status);
    if (rank !== 0) return rank;
    return b.updatedAt.getTime() - a.updatedAt.getTime();
  });

  const activeCount = bonds.filter((b) => b.status === BondStatus.ACTIVE).length;
  const pendingCount = bonds.filter((b) => PENDING_STATUSES.includes(b.status)).length;
  const firstName = user.name?.split(/\s+/)[0] ?? 'Citizen';

  return (
    <div className="dashboard-shell mx-auto w-full max-w-3xl">
      <header className="shrink-0 rounded-2xl border border-teal-100/80 bg-white px-4 py-3.5 shadow-sm sm:px-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-teal-700">
              Citizen Portal
            </p>
            <h1 className="mt-0.5 text-lg font-bold text-apcrda-primary sm:text-xl">
              Welcome, {firstName}
            </h1>
            <p className="mt-0.5 text-xs text-slate-500">
              Track your TDR bonds and download certificates
            </p>
          </div>
          {bonds.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                <FileText className="h-3.5 w-3.5 text-slate-500" />
                {bonds.length} bond{bonds.length === 1 ? '' : 's'}
              </span>
              {activeCount > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-100">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {activeCount} active
                </span>
              )}
              {pendingCount > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800 ring-1 ring-amber-100">
                  <Clock className="h-3.5 w-3.5" />
                  {pendingCount} in progress
                </span>
              )}
            </div>
          )}
        </div>
      </header>

      {bonds.length === 0 ? (
        <Card padding="none" className="flex-1">
          <EmptyState
            icon={FileText}
            title="No bonds linked yet"
            description="Your TDR bonds will appear here once registered by a DEO at the APCRDA office."
            className="py-16"
          />
        </Card>
      ) : (
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pb-1">
          {sorted.map((bond) => {
            const isActive = bond.status === BondStatus.ACTIVE;
            const land = bond.landDetails;

            return (
              <Card key={bond.id} padding="sm" className="shadow-sm">
                <div className="mb-2.5 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Award className="h-4 w-4 shrink-0 text-apcrda-secondary" />
                      <h2 className="truncate text-base font-bold text-apcrda-primary">
                        {bond.tdrNumber}
                      </h2>
                    </div>
                    {bond.holder?.name && (
                      <p className="mt-0.5 truncate text-sm text-slate-600">{bond.holder.name}</p>
                    )}
                  </div>
                  <Badge status={bond.status} />
                </div>

                {land && (
                  <div className="mb-2.5 grid grid-cols-3 gap-2 rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2.5 text-sm">
                    <div className="min-w-0">
                      <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        <MapPin className="h-3 w-3" />
                        Village
                      </p>
                      <p className="truncate font-medium text-slate-800">
                        {land.surrenderedVillage}
                      </p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        Survey
                      </p>
                      <p className="truncate font-mono text-[13px] font-medium text-slate-800">
                        {land.surveyNumber}
                      </p>
                    </div>
                    <div className="min-w-0 text-right">
                      <p className="flex items-center justify-end gap-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        <Ruler className="h-3 w-3" />
                        Sq Yds
                      </p>
                      <p className="font-semibold tabular-nums text-slate-800">
                        {Number(land.tdrIssuedExtentSqYds).toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>
                )}

                {isActive ? (
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2 text-xs font-medium text-emerald-800">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                      Certificate ready
                    </div>
                    <Button
                      href={`/farmer/certificates/${bond.id}`}
                      variant="accent"
                      size="sm"
                      className="w-full sm:w-auto"
                    >
                      <Download className="h-4 w-4" />
                      View &amp; Download
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <p className="text-[11px] font-medium text-slate-500">
                      {BOND_STATUS_LABELS[bond.status]}
                    </p>
                    <BondStatusTracker status={bond.status} compact />
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
