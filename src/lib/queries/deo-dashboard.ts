import { BondStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { isPendingStatus } from '@/lib/bond-status';

export interface DeoDashboardBond {
  id: string;
  tdrNumber: string;
  status: BondStatus;
  updatedAt: Date;
  holderName: string | null;
  surveyNumber: string | null;
  surrenderedAreaSqYds: number | null;
}

export interface DeoDashboardData {
  bonds: DeoDashboardBond[];
  stats: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    drafts: number;
  };
}

/** Bonds created by the logged-in DEO / Surveyor — PostgreSQL only */
export async function getDeoDashboardData(officialId: string): Promise<DeoDashboardData> {
  const bonds = await prisma.tdrBond.findMany({
    where: { createdBy: officialId },
    include: { holder: true, landDetails: true },
    orderBy: { updatedAt: 'desc' },
  });

  const mapped: DeoDashboardBond[] = bonds.map((bond) => ({
    id: bond.id,
    tdrNumber: bond.tdrNumber,
    status: bond.status,
    updatedAt: bond.updatedAt,
    holderName: bond.holder?.name ?? null,
    surveyNumber: bond.landDetails?.surveyNumber ?? null,
    surrenderedAreaSqYds: bond.landDetails ? Number(bond.landDetails.surrenderedAreaSqYds) : null,
  }));

  return {
    bonds: mapped,
    stats: {
      total: bonds.length,
      pending: bonds.filter((b) => isPendingStatus(b.status)).length,
      approved: bonds.filter((b) => b.status === BondStatus.ACTIVE).length,
      rejected: bonds.filter((b) => b.status === BondStatus.REJECTED).length,
      drafts: bonds.filter((b) => b.status === BondStatus.DRAFT).length,
    },
  };
}
