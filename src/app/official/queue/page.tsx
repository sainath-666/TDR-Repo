import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/supabase/client';
import { prisma } from '@/lib/prisma';
import { BondStatus } from '@prisma/client';
import { getQueueStatusForRole } from '@/types';

export default async function OfficialQueuePage() {
  const user = await getCurrentUser(cookies());
  if (!user) redirect('/official-login');

  const queueStatus = getQueueStatusForRole(user.role);
  const where =
    user.role === 'COMMISSIONER' || user.role === 'ADDL_COMMISSIONER'
      ? { status: BondStatus.PENDING_L4 }
      : {
          status: queueStatus ?? undefined,
          holder: user.districtCode ? { district: user.districtCode } : undefined,
        };

  const bonds = await prisma.tdrBond.findMany({
    where,
    include: { holder: true, landDetails: true, farmer: true },
    orderBy: { updatedAt: 'asc' },
  });

  return (
    <main className="min-h-screen p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-apcrda-primary mb-2">Approval Queue</h1>
      <p className="text-slate-500 mb-6">
        {queueStatus ? `Bonds awaiting ${queueStatus}` : 'All pending bonds'}
        <span className="ml-2 bg-apcrda-secondary text-white px-2 py-0.5 rounded text-sm">
          {bonds.length}
        </span>
      </p>

      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left p-3">TDR No</th>
              <th className="text-left p-3">Farmer</th>
              <th className="text-left p-3">Village</th>
              <th className="text-left p-3">Survey</th>
              <th className="text-left p-3">Area Sq Yds</th>
              <th className="text-left p-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {bonds.map((bond) => (
              <tr key={bond.id} className="border-t hover:bg-slate-50">
                <td className="p-3 font-medium">{bond.tdrNumber}</td>
                <td className="p-3">{bond.farmer.name}</td>
                <td className="p-3">{bond.holder?.village}</td>
                <td className="p-3">{bond.landDetails?.surveyNumber}</td>
                <td className="p-3">{bond.landDetails ? Number(bond.landDetails.surrenderedAreaSqYds) : '—'}</td>
                <td className="p-3">
                  <Link
                    href={`/official/bonds/${bond.id}/review`}
                    className="text-apcrda-primary underline"
                  >
                    Review
                  </Link>
                </td>
              </tr>
            ))}
            {bonds.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-400">No bonds in queue</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
