import Link from 'next/link';
import { redirect } from 'next/navigation';
import { PublicPageLayout } from '@/components/layout/PublicPageLayout';
import { PortalPageShell } from '@/components/layout/PortalPageShell';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { getEntitlementEntries } from '@/lib/portal-stats';

export default async function VerifySearchPage({ searchParams }: { searchParams: { q?: string } }) {
  const query = searchParams.q?.trim();
  if (query) {
    redirect(`/verify/${encodeURIComponent(query)}`);
  }

  const entries = await getEntitlementEntries(100);

  return (
    <PublicPageLayout>
      <PortalPageShell
        title="TDR Entitlement"
        subtitle="TDR Entitlement list is open for public objection. Submit your grievance within 15 days (if any)."
      >
        <form action="/verify" method="get" className="mb-6 flex justify-end">
          <input
            name="q"
            type="search"
            placeholder="Search by Reference / Application No."
            className="w-full max-w-sm rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-[var(--portal-purple)] focus:outline-none focus:ring-1 focus:ring-[var(--portal-purple)]"
          />
        </form>

        <Card padding="none" className="overflow-x-auto">
          <table className="data-table min-w-[1000px]">
            <thead>
              <tr>
                <th>S.No</th>
                <th>TDR Reference No</th>
                <th>TDR Issued Date</th>
                <th>Total Tdr Extent</th>
                <th>TDR Holder Name(s)</th>
                <th>Original Land Details</th>
                <th>LPS Unit Name</th>
                <th>Status</th>
                <th>Report Objection</th>
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
                    <td>
                      <Link
                        href={`/verify/${entry.tdrNumber}`}
                        className="font-semibold hover:underline"
                        style={{ color: 'var(--portal-blue)' }}
                      >
                        {entry.tdrNumber}
                      </Link>
                    </td>
                    <td>{entry.updatedAt.toLocaleDateString('en-IN')}</td>
                    <td>{entry.areaSqYds?.toFixed(2) ?? '—'} Sq.Yds</td>
                    <td>{entry.holderName ?? '—'}</td>
                    <td className="text-slate-600">
                      {entry.surveyNumber ? `Survey ${entry.surveyNumber}` : '—'}
                      {entry.village ? ` · ${entry.village}` : ''}
                    </td>
                    <td>{entry.village ?? '—'}</td>
                    <td>
                      <Badge status={entry.status} />
                    </td>
                    <td>
                      <button
                        type="button"
                        className="text-xs font-semibold text-[var(--portal-purple)] hover:underline"
                      >
                        Objection
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Card>

        <p className="mt-6 text-center text-xs text-red-600">
          The data displayed above has been extracted from the proceedings issued and confirmed by
          the SDC LPS Units.
        </p>
      </PortalPageShell>
    </PublicPageLayout>
  );
}
