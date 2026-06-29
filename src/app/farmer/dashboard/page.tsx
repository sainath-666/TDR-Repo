import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Download, MapPin, Ruler, FileText, Award } from 'lucide-react';
import { getCurrentUser } from '@/lib/supabase/client';
import { prisma } from '@/lib/prisma';
import { BondStatus } from '@prisma/client';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { BondStatusTracker } from '@/components/farmer/BondStatusTracker';

export default async function FarmerDashboardPage() {
  const user = await getCurrentUser(cookies());
  if (!user) redirect('/farmer-login');

  const farmerId = user.farmerId ?? user.id;
  const bonds = await prisma.tdrBond.findMany({
    where: { farmerId },
    include: { holder: true, landDetails: true },
    orderBy: { createdAt: 'desc' },
  });

  const activeCount = bonds.filter((b) => b.status === BondStatus.ACTIVE).length;
  const pendingCount = bonds.filter((b) => b.status.startsWith('PENDING')).length;

  return (
    <div className="dashboard-shell">
      <div className="relative shrink-0 overflow-hidden rounded-xl gradient-primary px-4 py-4 text-white shadow-sm">
        <div className="relative flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-300/90">
              Farmer Portal
            </p>
            <h1 className="text-lg font-bold">My TDR Bonds</h1>
            <p className="mt-0.5 text-xs text-sky-100/90">
              Track status &amp; download certificates
            </p>
          </div>
          <div className="flex gap-4 text-center">
            <div>
              <p className="text-lg font-bold tabular-nums">{bonds.length}</p>
              <p className="text-[10px] text-sky-200/80">Total</p>
            </div>
            <div>
              <p className="text-lg font-bold tabular-nums text-emerald-300">{activeCount}</p>
              <p className="text-[10px] text-sky-200/80">Active</p>
            </div>
            <div>
              <p className="text-lg font-bold tabular-nums text-amber-300">{pendingCount}</p>
              <p className="text-[10px] text-sky-200/80">Pending</p>
            </div>
          </div>
        </div>
      </div>

      {bonds.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No bonds linked yet"
          description="Your TDR bonds will appear here once registered by a DEO at the APCRDA office."
          className="py-10"
        />
      ) : (
        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-0.5">
          {bonds.map((bond) => (
            <Card key={bond.id} padding="xs" className="overflow-hidden" hover>
              <div className="mb-2 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <Award className="h-3.5 w-3.5 shrink-0 text-apcrda-secondary" />
                    <h2 className="truncate text-sm font-bold text-apcrda-primary">
                      {bond.tdrNumber}
                    </h2>
                  </div>
                  {bond.holder && (
                    <p className="truncate text-xs text-slate-500">{bond.holder.name}</p>
                  )}
                </div>
                <Badge status={bond.status} />
              </div>

              {bond.landDetails && (
                <div className="mb-2 grid grid-cols-2 gap-2 rounded-lg bg-slate-50 p-2 text-xs">
                  <div className="flex items-start gap-1.5">
                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                    <div className="min-w-0">
                      <p className="text-[9px] font-medium uppercase tracking-wider text-slate-400">
                        Village
                      </p>
                      <p className="truncate text-slate-700">
                        {bond.landDetails.surrenderedVillage}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <Ruler className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                    <div>
                      <p className="text-[9px] font-medium uppercase tracking-wider text-slate-400">
                        Sq Yds
                      </p>
                      <p className="font-semibold text-slate-700">
                        {Number(bond.landDetails.surrenderedAreaSqYds).toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <BondStatusTracker status={bond.status} compact />

              {bond.status === BondStatus.ACTIVE && (
                <Button
                  href={`/farmer/certificates/${bond.id}`}
                  variant="accent"
                  size="sm"
                  className="mt-2 w-full"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download Certificate
                </Button>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
