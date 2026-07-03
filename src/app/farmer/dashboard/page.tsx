import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Download, MapPin, Ruler, FileText, Award, CheckCircle2 } from 'lucide-react';
import { getCurrentUser } from '@/lib/supabase/client';
import { prisma } from '@/lib/prisma';
import { BondStatus } from '@prisma/client';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { BondStatusTracker } from '@/components/farmer/BondStatusTracker';
import { TdrCertificatePreview } from '@/components/farmer/TdrCertificatePreview';
import { buildCertificatePreviewData } from '@/lib/certificate/preview-data';

export default async function FarmerDashboardPage() {
  const user = await getCurrentUser(cookies());
  if (!user) redirect('/farmer-login');

  const farmerId = user.farmerId ?? user.id;
  const bonds = await prisma.tdrBond.findMany({
    where: { farmerId },
    include: { holder: true, landDetails: true },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="mx-auto flex h-full min-h-0 w-full max-w-3xl flex-col gap-4">
      {bonds.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No bonds linked yet"
          description="Your TDR bonds will appear here once registered by a DEO at the APCRDA office."
          className="py-16"
        />
      ) : (
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pb-2">
          {bonds.map((bond) => {
            const isActive = bond.status === BondStatus.ACTIVE;
            const certPreview = isActive ? buildCertificatePreviewData(bond) : null;

            return (
              <Card key={bond.id} padding="sm" className="overflow-hidden shadow-sm">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Award className="h-4 w-4 shrink-0 text-apcrda-secondary" />
                      <h2 className="truncate text-base font-bold text-apcrda-primary">
                        {bond.tdrNumber}
                      </h2>
                    </div>
                    {bond.holder && (
                      <p className="mt-0.5 truncate text-sm text-slate-600">{bond.holder.name}</p>
                    )}
                  </div>
                  <Badge status={bond.status} />
                </div>

                {bond.landDetails && (
                  <div className="mb-3 grid grid-cols-2 gap-3 rounded-lg border border-slate-100 bg-slate-50/80 p-3 text-sm">
                    <div className="flex items-start gap-2">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          Village
                        </p>
                        <p className="truncate font-medium text-slate-800">
                          {bond.landDetails.surrenderedVillage}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Ruler className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          TDR Extent
                        </p>
                        <p className="font-semibold text-slate-800">
                          {Number(bond.landDetails.tdrIssuedExtentSqYds).toLocaleString('en-IN')} Sq
                          Yds
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {isActive ? (
                  <div className="mb-3 flex items-center gap-2 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                    Certificate issued — all approvals complete
                  </div>
                ) : (
                  <BondStatusTracker status={bond.status} compact />
                )}

                {certPreview && (
                  <div className="space-y-2 border-t border-slate-100 pt-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      Certificate Preview
                    </p>
                    <TdrCertificatePreview data={certPreview} compact />
                    <Button
                      href={`/farmer/certificates/${bond.id}`}
                      variant="accent"
                      size="sm"
                      className="w-full"
                    >
                      <Download className="h-4 w-4" />
                      View Full Certificate &amp; Download PDF
                    </Button>
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
