import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/supabase/client';
import { prisma } from '@/lib/prisma';
import { BondStatus } from '@prisma/client';

const statusColors: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-700',
  PENDING_L1: 'bg-yellow-100 text-yellow-800',
  PENDING_L2: 'bg-orange-100 text-orange-800',
  PENDING_L3: 'bg-blue-100 text-blue-800',
  PENDING_L4: 'bg-purple-100 text-purple-800',
  ACTIVE: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  REVOKED: 'bg-gray-100 text-gray-800',
};

export default async function DeoDashboardPage() {
  const user = await getCurrentUser(cookies());
  if (!user) redirect('/official-login');

  const bonds = await prisma.tdrBond.findMany({
    where: { createdBy: user.id },
    include: { holder: true, landDetails: true },
    orderBy: { createdAt: 'desc' },
  });

  const stats = {
    total: bonds.length,
    pending: bonds.filter((b) => b.status.startsWith('PENDING')).length,
    approved: bonds.filter((b) => b.status === BondStatus.ACTIVE).length,
    rejected: bonds.filter((b) => b.status === BondStatus.REJECTED).length,
  };

  return (
    <main className="min-h-screen p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-apcrda-primary">DEO Dashboard</h1>
          <p className="text-slate-500">Offline TDR Bond Data Entry</p>
        </div>
        <Link href="/deo/bonds/new" className="bg-apcrda-primary text-white px-4 py-2 rounded-lg">
          New Bond Entry
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total', value: stats.total },
          { label: 'Pending', value: stats.pending },
          { label: 'Approved', value: stats.approved },
          { label: 'Rejected', value: stats.rejected },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-lg border p-4">
            <p className="text-sm text-slate-500">{s.label}</p>
            <p className="text-2xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left p-3">TDR No</th>
              <th className="text-left p-3">Holder</th>
              <th className="text-left p-3">Survey</th>
              <th className="text-left p-3">Area (Sq Yds)</th>
              <th className="text-left p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {bonds.map((bond) => (
              <tr key={bond.id} className="border-t">
                <td className="p-3 font-medium">{bond.tdrNumber}</td>
                <td className="p-3">{bond.holder?.name ?? '—'}</td>
                <td className="p-3">{bond.landDetails?.surveyNumber ?? '—'}</td>
                <td className="p-3">
                  {bond.landDetails ? Number(bond.landDetails.surrenderedAreaSqYds) : '—'}
                </td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded text-xs ${statusColors[bond.status]}`}>
                    {bond.status}
                  </span>
                </td>
              </tr>
            ))}
            {bonds.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-400">
                  No bonds yet. Create your first bond entry.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
