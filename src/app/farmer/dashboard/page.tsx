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
    <>
      <div className="relative mb-6 md:mb-8 overflow-hidden rounded-2xl gradient-primary px-5 py-8 md:px-8 md:py-10 text-white shadow-card animate-fade-in">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-apcrda-secondary blur-3xl" />
        </div>
        <div className="relative flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
          <div>
            <p className="text-apcrda-secondary font-semibold text-xs uppercase tracking-wider">
              Farmer Portal · APCRDA
            </p>
            <h1 className="text-2xl md:text-3xl font-bold mt-1">My TDR Bonds</h1>
            <p className="text-slate-300 text-sm mt-2 max-w-md">
              Track approval status and download certificates
            </p>
          </div>
          <div className="flex gap-6 sm:gap-8">
            <div className="text-center sm:text-right">
              <p className="text-2xl font-bold">{bonds.length}</p>
              <p className="text-xs text-slate-300">Total</p>
            </div>
            <div className="text-center sm:text-right">
              <p className="text-2xl font-bold text-emerald-300">{activeCount}</p>
              <p className="text-xs text-slate-300">Active</p>
            </div>
            <div className="text-center sm:text-right">
              <p className="text-2xl font-bold text-amber-300">{pendingCount}</p>
              <p className="text-xs text-slate-300">In Progress</p>
            </div>
          </div>
        </div>
      </div>

      {bonds.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No bonds linked yet"
          description="Your TDR bonds will appear here once registered by a DEO at the APCRDA office. Contact your local office for assistance."
        />
      ) : (
        <div className="space-y-4">
          {bonds.map((bond, index) => (
            <Card
              key={bond.id}
              className="animate-slide-up overflow-hidden"
              hover
              style={{ animationDelay: `${index * 60}ms` }}
            >
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-apcrda-secondary shrink-0" />
                    <h2 className="font-bold text-lg text-apcrda-primary">{bond.tdrNumber}</h2>
                  </div>
                  {bond.holder && (
                    <p className="text-sm text-slate-500 mt-0.5">{bond.holder.name}</p>
                  )}
                </div>
                <Badge status={bond.status} size="md" />
              </div>

              {bond.landDetails && (
                <div className="grid grid-cols-2 gap-3 mb-5 p-3 rounded-lg bg-slate-50">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">
                        Village
                      </p>
                      <p className="text-sm text-slate-700">
                        {bond.landDetails.surrenderedVillage}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Ruler className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">
                        Area (Sq Yds)
                      </p>
                      <p className="text-sm text-slate-700 font-semibold">
                        {Number(bond.landDetails.surrenderedAreaSqYds).toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="mb-4">
                <p className="text-[10px] uppercase tracking-wider text-slate-400 font-medium mb-3">
                  Approval Progress
                </p>
                <BondStatusTracker status={bond.status} compact />
              </div>

              {bond.status === BondStatus.ACTIVE && (
                <Button
                  href={`/farmer/certificates/${bond.id}`}
                  variant="accent"
                  className="w-full"
                >
                  <Download className="h-4 w-4" />
                  Download Certificate
                </Button>
              )}

              {bond.status.startsWith('PENDING') && (
                <p className="text-xs text-center text-slate-400 mt-2">
                  Submitted {bond.updatedAt.toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                </p>
              )}
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
