import { cookies } from 'next/headers';
import { BondStatus } from '@prisma/client';
import { withErrorHandling, AuthenticationError } from '@/lib/errors';
import { ok } from '@/lib/api-response';
import { getCurrentUser } from '@/lib/supabase/client';
import { prisma } from '@/lib/prisma';
import { isPendingStatus } from '@/lib/bond-status';

export const GET = withErrorHandling(async () => {
  const user = await getCurrentUser(cookies());
  if (!user) throw new AuthenticationError();
  if (user.role !== 'FARMER') throw new AuthenticationError('Farmer access required');

  const farmerId = user.farmerId ?? user.id;
  const bonds = await prisma.tdrBond.findMany({
    where: { farmerId },
    include: { holder: true, landDetails: true },
    orderBy: { createdAt: 'desc' },
  });

  return ok({
    bonds: bonds.map((bond) => ({
      id: bond.id,
      tdrNumber: bond.tdrNumber,
      status: bond.status,
      updatedAt: bond.updatedAt,
      holderName: bond.holder?.name ?? null,
      village: bond.landDetails?.surrenderedVillage ?? bond.holder?.village ?? null,
      areaSqYds: bond.landDetails ? Number(bond.landDetails.surrenderedAreaSqYds) : null,
    })),
    summary: {
      total: bonds.length,
      active: bonds.filter((b) => b.status === BondStatus.ACTIVE).length,
      pending: bonds.filter((b) => isPendingStatus(b.status)).length,
      rejected: bonds.filter((b) => b.status === BondStatus.REJECTED).length,
      drafts: bonds.filter((b) => b.status === BondStatus.DRAFT).length,
    },
  });
});
