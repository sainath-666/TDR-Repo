import Link from 'next/link';
import { PublicPageLayout } from '@/components/layout/PublicPageLayout';
import { PortalPageShell } from '@/components/layout/PortalPageShell';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { getTdrBankEntries } from '@/lib/portal-stats';

export default async function TdrBankPage() {
  const entries = await getTdrBankEntries();

  return (
    <PublicPageLayout>
      <PortalPageShell title="TDR Bank">
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-bold text-slate-800">
            Total No of TDR certificates:{' '}
            <span className="text-[var(--portal-purple)]">{entries.length}</span>
          </p>
          <p className="text-xs text-red-600">Note: Names With Red Colour Have Citizen Objection</p>
        </div>

        <Card padding="none" className="overflow-x-auto">
          <table className="data-table min-w-[900px]">
            <thead>
              <tr>
                <th>SNo</th>
                <th>TDR Holder Name</th>
                <th>Site Address</th>
                <th>Extent Of TDR Issued (Sq.Yd.)</th>
                <th>Balance TDR (Sq.Yd.)</th>
                <th>TDR Market value (per Sq.Yd.)</th>
                <th>No of Holders</th>
                <th>Status</th>
                <th>Submit</th>
              </tr>
            </thead>
            <tbody>
              {entries.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    No data available.
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
                      <Badge status={entry.status} />
                    </td>
                    <td>
                      <Link
                        href={`/verify/${entry.tdrNumber}`}
                        className="text-xs font-semibold hover:underline"
                        style={{ color: 'var(--portal-blue)' }}
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Card>
      </PortalPageShell>
    </PublicPageLayout>
  );
}
