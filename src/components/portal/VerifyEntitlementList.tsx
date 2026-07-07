'use client';

import Link from 'next/link';
import { PortalPageShell } from '@/components/layout/PortalPageShell';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { resolveBondStatus } from '@/lib/bond-status';
import { useLocale } from '@/lib/i18n/locale-context';
import type { PublicBondSummary } from '@/lib/portal-stats';

export function VerifyEntitlementList({ entries }: { entries: PublicBondSummary[] }) {
  const { t } = useLocale();

  const statusLabel = (status?: string) => {
    const resolved = resolveBondStatus(status);
    return resolved ? t.bondStatus[resolved] : undefined;
  };

  return (
    <PortalPageShell title={t.verify.title} subtitle={t.verify.subtitle}>
      <form action="/verify" method="get" className="mb-6 flex justify-end">
        <input
          name="q"
          type="search"
          placeholder={t.verify.searchPlaceholder}
          className="w-full max-w-sm rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-[var(--portal-purple)] focus:outline-none focus:ring-1 focus:ring-[var(--portal-purple)]"
        />
      </form>

      <Card padding="none" className="overflow-x-auto">
        <table className="data-table min-w-[1000px]">
          <thead>
            <tr>
              <th>{t.common.sNo}</th>
              <th>{t.verify.colRef}</th>
              <th>{t.verify.colIssuedDate}</th>
              <th>{t.verify.colExtent}</th>
              <th>{t.verify.colHolders}</th>
              <th>{t.verify.colLandDetails}</th>
              <th>{t.verify.colLpsUnit}</th>
              <th>{t.common.status}</th>
              <th>{t.verify.colObjection}</th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-500">
                  {t.common.noData}
                </td>
              </tr>
            ) : (
              entries.map((entry, i) => (
                <tr key={entry.tdrNumber}>
                  <td>{i + 1}</td>
                  <td>
                    <Link
                      href={`/verify/${entry.tdrNumber}`}
                      className="font-semibold hover:underline"
                      style={{ color: 'var(--portal-blue)' }}
                    >
                      {entry.tdrNumber}
                    </Link>
                  </td>
                  <td>{new Date(entry.updatedAt).toLocaleDateString('en-IN')}</td>
                  <td>{entry.areaSqYds?.toFixed(2) ?? '—'} Sq.Yds</td>
                  <td>{entry.holderName ?? '—'}</td>
                  <td className="text-slate-600">
                    {entry.surveyNumber ? `${t.verify.survey} ${entry.surveyNumber}` : '—'}
                    {entry.village ? ` · ${entry.village}` : ''}
                  </td>
                  <td>{entry.village ?? '—'}</td>
                  <td>
                    <Badge status={entry.status} label={statusLabel(entry.status)} />
                  </td>
                  <td>
                    <button
                      type="button"
                      className="text-xs font-semibold text-[var(--portal-purple)] hover:underline"
                    >
                      {t.verify.objection}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>

      <p className="mt-6 text-center text-xs text-red-600">{t.verify.disclaimer}</p>
    </PortalPageShell>
  );
}
