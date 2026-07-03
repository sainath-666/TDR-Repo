import { cookies, headers } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { BondStatus } from '@prisma/client';
import { getCurrentUser } from '@/lib/supabase/client';
import { prisma } from '@/lib/prisma';
import { getBondWithRelations } from '@/lib/bond-helpers';
import { buildCertificatePreviewData } from '@/lib/certificate/preview-data';
import { ensureFarmerBondCertificate } from '@/lib/certificate/mint';
import { CertificateDownloadClient } from '@/app/farmer/certificates/[id]/CertificateDownloadClient';

function requestOrigin(): string {
  const headerList = headers();
  const host = headerList.get('x-forwarded-host') ?? headerList.get('host') ?? 'localhost:3000';
  const protocol = headerList.get('x-forwarded-proto') ?? 'http';
  return `${protocol}://${host}`;
}

export default async function CertificateDownloadPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser(cookies());
  if (!user) redirect('/farmer-login');

  const farmerId = user.farmerId ?? user.id;
  const owned = await prisma.tdrBond.findFirst({
    where: { id: params.id, farmerId },
    select: { id: true, status: true },
  });

  if (!owned) notFound();
  if (owned.status !== BondStatus.ACTIVE) redirect('/farmer/dashboard');

  await ensureFarmerBondCertificate(params.id, requestOrigin());

  const bond = await getBondWithRelations(params.id);
  const preview = buildCertificatePreviewData(bond);
  if (!preview) notFound();

  return (
    <CertificateDownloadClient bondId={bond.id} tdrNumber={bond.tdrNumber} preview={preview} />
  );
}
