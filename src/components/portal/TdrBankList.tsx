'use client';

import Link from 'next/link';
import { PortalPageShell } from '@/components/layout/PortalPageShell';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { resolveBondStatus } from '@/lib/bond-status';
import { useLocale } from '@/lib/i18n/locale-context';
import type { TdrBankEntry } from '@/lib/portal-stats';

export function TdrBankList({ entries }: { entries: TdrBankEntry[] }) {
  const { t } = useLocale();

  const statusLabel = (status?: string) => {
    const resolved = resolveBondStatus(status);
    return resolved ? t.bondStatus[resolved] : undefined;
  };

  return (
    <PortalPageShell title={t.tdrBank.title}>
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-bold text-slate-800">
          {t.tdrBank.total} <span className="text-[var(--portal-purple)]">{entries.length}</span>
        </p>
        <p className="text-xs text-red-600">{t.tdrBank.note}</p>
      </div>

      <Card padding="none" className="overflow-x-auto">
        <table className="data-table min-w-[900px]">
          <thead>
            <tr>
              <th>{t.common.sNo}</th>
              <th>{t.tdrBank.colHolder}</th>
              <th>{t.tdrBank.colSiteAddress}</th>
              <th>{t.tdrBank.colExtentIssued}</th>
              <th>{t.tdrBank.colBalance}</th>
              <th>{t.tdrBank.colMarketValue}</th>
              <th>{t.tdrBank.colHolders}</th>
              <th>{t.common.status}</th>
              <th>{t.tdrBank.colSubmit}</th>
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
                  <td className="font-medium">{entry.holderName ?? '—'}</td>
                  <td className="max-w-[200px] text-slate-600">{entry.siteAddress ?? '—'}</td>
                  <td>{entry.extentIssuedSqYds?.toFixed(2) ?? '—'}</td>
                  <td>{entry.balanceSqYds?.toFixed(2) ?? '—'}</td>
                  <td>—</td>
                  <td>1</td>
                  <td>
                    <Badge status={entry.status} label={statusLabel(entry.status)} />
                  </td>
                  <td>
                    <Link
                      href={`/verify/${entry.tdrNumber}`}
                      className="text-xs font-semibold hover:underline"
                      style={{ color: 'var(--portal-blue)' }}
                    >
                      {t.common.view}
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>
    </PortalPageShell>
  );
}
