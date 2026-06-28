import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/supabase/client';
import { prisma } from '@/lib/prisma';
import { BondStatus } from '@prisma/client';
import { BondStatusTracker } from '@/components/farmer/BondStatusTracker';

export default async function FarmerDashboardPage() {
  const user = await getCurrentUser(cookies());
  if (!user) redirect('/farmer-login');

  const farmerId = user.farmerId ?? user.id;
  const bonds = await prisma.tdrBond.findMany({
    where: { farmerId },
    include: { holder: true, landDetails: true, approvalSteps: true },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <main className="min-h-screen p-4 max-w-lg mx-auto">
      <h1 className="text-xl font-bold text-apcrda-primary mb-4">My TDR Bonds</h1>
      <div className="space-y-4">
        {bonds.map((bond) => (
          <div key={bond.id} className="bg-white rounded-lg border p-4 shadow-sm">
            <div className="flex justify-between items-start mb-3">
              <h2 className="font-semibold">{bond.tdrNumber}</h2>
              <span
                className={`text-xs px-2 py-1 rounded ${bond.status === BondStatus.ACTIVE ? 'bg-green-100 text-green-800' : 'bg-slate-100'}`}
              >
                {bond.status}
              </span>
            </div>
            <BondStatusTracker status={bond.status} />
            {bond.status === BondStatus.ACTIVE && (
              <Link
                href={`/farmer/certificates/${bond.id}`}
                className="mt-3 block text-center bg-apcrda-accent text-white py-2 rounded-lg text-sm"
              >
                Download Certificate
              </Link>
            )}
          </div>
        ))}
        {bonds.length === 0 && (
          <p className="text-center text-slate-400 py-8">No bonds linked to your account yet.</p>
        )}
      </div>
    </main>
  );
}
