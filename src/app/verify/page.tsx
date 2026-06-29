import Link from 'next/link';
import { redirect } from 'next/navigation';
import { BondStatus } from '@prisma/client';
import { PublicPageLayout } from '@/components/layout/PublicPageLayout';
import { Badge } from '@/components/ui/Badge';
import { getVerifiableBonds } from '@/lib/portal-stats';

export default async function VerifySearchPage({ searchParams }: { searchParams: { q?: string } }) {
  const query = searchParams.q?.trim();
  if (query) {
    redirect(`/verify/${encodeURIComponent(query)}`);
  }

  const activeBonds = await getVerifiableBonds(20);

  return (
    <PublicPageLayout>
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-apcrda-primary">Verify TDR Certificate</h1>
          <p className="text-sm text-slate-500 mt-2">
            Enter a TDR number to check certificate validity from the official database
          </p>
        </div>

        <form
          action="/verify"
          method="get"
          className="bg-white rounded-2xl border shadow-card p-6 mb-8"
        >
          <label htmlFor="tdr" className="block text-sm font-semibold text-slate-700 mb-2">
            TDR Bond Number
          </label>
          <div className="flex gap-3">
            <input
              id="tdr"
              name="q"
              type="text"
              required
              placeholder="Enter TDR number"
              className="flex-1 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-apcrda-primary/25"
            />
            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-apcrda-primary text-white font-semibold text-sm hover:bg-apcrda-primary-light"
            >
              Verify
            </button>
          </div>
        </form>

        {activeBonds.length > 0 && (
          <div className="bg-white rounded-2xl border shadow-card overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-apcrda-primary">Active Certificates in Database</h2>
              <p className="text-xs text-slate-500 mt-0.5">Click to verify</p>
            </div>
            <ul className="divide-y divide-slate-100">
              {activeBonds.map((bond) => (
                <li key={bond.tdrNumber}>
                  <Link
                    href={`/verify/${bond.tdrNumber}`}
                    className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition-colors"
                  >
                    <div>
                      <p className="font-semibold text-apcrda-primary">{bond.tdrNumber}</p>
                      <p className="text-xs text-slate-500">
                        {bond.holderName ?? '—'}
                        {bond.village ? ` · ${bond.village}` : ''}
                      </p>
                    </div>
                    <Badge status={BondStatus.ACTIVE} />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </PublicPageLayout>
  );
}
