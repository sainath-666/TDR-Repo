import { withErrorHandling, NotFoundError } from '@/lib/errors';
import { ok } from '@/lib/api-response';
import { prisma } from '@/lib/prisma';
import { writeAuditLog } from '@/lib/audit';
import { NextRequest } from 'next/server';
import { getClientIp } from '@/lib/bond-helpers';
import { BondStatus } from '@prisma/client';

export const GET = withErrorHandling(
  async (req: NextRequest, { params }: { params: { bondId: string } }) => {
    const bond = await prisma.tdrBond.findUnique({
      where: { id: params.bondId },
      include: { holder: true, landDetails: true },
    });

    if (!bond) throw new NotFoundError('bond', params.bondId);

    const isPublicVerify = req.nextUrl.pathname.includes('/verify');

    await writeAuditLog({
      bondId: bond.id,
      action: 'CERT_VERIFIED',
      details: { tdrNumber: bond.tdrNumber, status: bond.status },
      ipAddress: getClientIp(req.headers),
    });

    return ok({
      tdrNumber: bond.tdrNumber,
      status: bond.status,
      valid: bond.status === BondStatus.ACTIVE,
      holderName: isPublicVerify ? bond.holder?.name : undefined,
      village: bond.landDetails?.surrenderedVillage,
      areaSqYds: bond.landDetails ? Number(bond.landDetails.tdrIssuedExtentSqYds) : null,
      ratio: bond.landDetails?.issuedRatio,
      mintedAt: bond.mintedAt,
    });
  },
);
