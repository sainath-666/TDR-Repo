'use client';

import Link from 'next/link';
import { AlertCircle, ArrowLeft, CheckCircle2, MapPin, Ruler } from 'lucide-react';
import { BondStatus } from '@prisma/client';
import { PortalPageShell } from '@/components/layout/PortalPageShell';
import { BondStatusTracker } from '@/components/farmer/BondStatusTracker';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { resolveBondStatus } from '@/lib/bond-status';
import { useLocale } from '@/lib/i18n/locale-context';
import type { BondStatusLookupResult } from '@/lib/portal-status';

interface StatusResultProps {
  result: BondStatusLookupResult;
}

export function StatusResult({ result }: StatusResultProps) {
  const { t } = useLocale();

  const statusLabel = (status?: string) => {
    const resolved = resolveBondStatus(status);
    return resolved ? t.bondStatus[resolved] : undefined;
  };

  return (
    <PortalPageShell title={t.statusPage.title}>
      <div className="mx-auto max-w-xl">
        <Link
          href="/status"
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--portal-purple)] hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          {t.statusPage.backToSearch}
        </Link>

        {!result.found ? (
          <Card>
            <div className="flex flex-col items-center py-6 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
                <AlertCircle className="h-7 w-7 text-red-500" />
              </div>
              <h2 className="text-lg font-bold text-slate-800">{t.statusPage.notFoundTitle}</h2>
              <p className="mt-2 text-sm text-slate-600">
                {t.statusPage.notFoundMessage.replace('{tdrNumber}', result.tdrNumber)}
              </p>
            </div>
          </Card>
        ) : (
          <Card>
            <div className="space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    {t.statusPage.tdrNumber}
                  </p>
                  <p className="mt-0.5 text-lg font-bold text-[var(--portal-blue)]">
                    {result.tdrNumber}
                  </p>
                </div>
                <Badge status={result.status} label={statusLabel(result.status)} size="md" />
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  {t.statusPage.workflowStage}
                </p>
                <BondStatusTracker status={result.status} />
              </div>

              {result.status === BondStatus.ACTIVE && (
                <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2.5 text-sm font-medium text-emerald-800">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  {t.statusPage.certificateActive}
                </div>
              )}

              {result.status === BondStatus.REJECTED && result.rejectionReason && (
                <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2.5 text-sm text-red-800">
                  <p className="font-semibold">{t.statusPage.rejectionReason}</p>
                  <p className="mt-1">{result.rejectionReason}</p>
                </div>
              )}

              {(result.village || result.surveyNumber || result.areaSqYds != null) && (
                <dl className="space-y-2 border-t border-slate-100 pt-4 text-sm">
                  {result.village && (
                    <div className="flex items-start gap-2">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                      <div>
                        <dt className="text-slate-500">{t.statusPage.village}</dt>
                        <dd className="font-medium text-slate-800">{result.village}</dd>
                      </div>
                    </div>
                  )}
                  {result.surveyNumber && (
                    <div className="flex justify-between gap-4">
                      <dt className="text-slate-500">{t.statusPage.surveyNumber}</dt>
                      <dd className="font-medium text-slate-800">{result.surveyNumber}</dd>
                    </div>
                  )}
                  {result.areaSqYds != null && (
                    <div className="flex items-start gap-2">
                      <Ruler className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                      <div className="flex flex-1 justify-between gap-4">
                        <dt className="text-slate-500">{t.statusPage.tdrExtent}</dt>
                        <dd className="font-medium text-slate-800">
                          {result.areaSqYds.toFixed(2)} Sq.Yds
                          {result.ratio ? ` (${result.ratio})` : ''}
                        </dd>
                      </div>
                    </div>
                  )}
                </dl>
              )}

              {result.holderName && (
                <div className="flex justify-between gap-4 border-t border-slate-100 pt-4 text-sm">
                  <dt className="text-slate-500">{t.statusPage.holderName}</dt>
                  <dd className="font-medium text-slate-800">{result.holderName}</dd>
                </div>
              )}

              <div className="flex justify-between gap-4 border-t border-slate-100 pt-4 text-sm">
                <dt className="text-slate-500">{t.statusPage.lastUpdated}</dt>
                <dd className="font-medium text-slate-800">
                  {new Date(result.updatedAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </dd>
              </div>

              {result.mintedAt && (
                <div className="flex justify-between gap-4 text-sm">
                  <dt className="text-slate-500">{t.statusPage.issuedDate}</dt>
                  <dd className="font-medium text-slate-800">
                    {new Date(result.mintedAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </dd>
                </div>
              )}
            </div>
          </Card>
        )}
      </div>
    </PortalPageShell>
  );
}
