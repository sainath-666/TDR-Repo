import { prisma } from '@/lib/prisma';
import { BondStatus } from '@prisma/client';
import { notFound } from 'next/navigation';

export default async function VerifyPage({ params }: { params: { tdrNumber: string } }) {
  const bond = await prisma.tdrBond.findUnique({
    where: { tdrNumber: params.tdrNumber },
    include: { holder: true, landDetails: true },
  });

  if (!bond) notFound();

  const valid = bond.status === BondStatus.ACTIVE;

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-xl font-bold text-apcrda-primary text-center">
          TDR Certificate Verification
        </h1>
        <div className={`mt-6 p-4 rounded-lg text-center ${valid ? 'bg-green-50' : 'bg-red-50'}`}>
          <p className={`text-lg font-semibold ${valid ? 'text-green-800' : 'text-red-800'}`}>
            {valid ? '✓ Valid Certificate' : '✗ Invalid or Pending'}
          </p>
        </div>
        <dl className="mt-6 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-slate-500">TDR Number</dt>
            <dd>{bond.tdrNumber}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">Status</dt>
            <dd>{bond.status}</dd>
          </div>
          {valid && bond.holder && (
            <div className="flex justify-between">
              <dt className="text-slate-500">Holder</dt>
              <dd>{bond.holder.name}</dd>
            </div>
          )}
          {bond.landDetails && (
            <>
              <div className="flex justify-between">
                <dt className="text-slate-500">Survey</dt>
                <dd>{bond.landDetails.surveyNumber}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">TDR Extent</dt>
                <dd>{Number(bond.landDetails.tdrIssuedExtentSqYds)} Sq Yards</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Ratio</dt>
                <dd>{bond.landDetails.issuedRatio}</dd>
              </div>
            </>
          )}
          {bond.mintedAt && (
            <div className="flex justify-between">
              <dt className="text-slate-500">Issued</dt>
              <dd>{bond.mintedAt.toLocaleDateString()}</dd>
            </div>
          )}
        </dl>
      </div>
    </main>
  );
}
