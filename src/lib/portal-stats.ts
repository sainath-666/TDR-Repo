import { BondStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export interface PortalStats {
  totalBonds: number;
  activeBonds: number;
  pendingBonds: number;
  registeredFarmers: number;
}

export interface PublicBondSummary {
  tdrNumber: string;
  status: BondStatus;
  holderName: string | null;
  village: string | null;
  surveyNumber: string | null;
  areaSqYds: number | null;
  updatedAt: Date;
}

export async function getPortalStats(): Promise<PortalStats> {
  const [totalBonds, activeBonds, pendingBonds, registeredFarmers] = await Promise.all([
    prisma.tdrBond.count(),
    prisma.tdrBond.count({ where: { status: BondStatus.ACTIVE } }),
    prisma.tdrBond.count({
      where: {
        status: {
          in: [
            BondStatus.PENDING_L1,
            BondStatus.PENDING_L2,
            BondStatus.PENDING_L3,
            BondStatus.PENDING_L4,
          ],
        },
      },
    }),
    prisma.farmer.count(),
  ]);

  return { totalBonds, activeBonds, pendingBonds, registeredFarmers };
}

export async function getRecentPublicBonds(limit = 8): Promise<PublicBondSummary[]> {
  const bonds = await prisma.tdrBond.findMany({
    take: limit,
    orderBy: { updatedAt: 'desc' },
    include: { holder: true, landDetails: true },
  });

  return bonds.map((bond) => ({
    tdrNumber: bond.tdrNumber,
    status: bond.status,
    holderName: bond.holder?.name ?? null,
    village: bond.landDetails?.surrenderedVillage ?? bond.holder?.village ?? null,
    surveyNumber: bond.landDetails?.surveyNumber ?? null,
    areaSqYds: bond.landDetails ? Number(bond.landDetails.surrenderedAreaSqYds) : null,
    updatedAt: bond.updatedAt,
  }));
}

export async function getVerifiableBonds(limit = 10): Promise<PublicBondSummary[]> {
  const bonds = await prisma.tdrBond.findMany({
    where: { status: BondStatus.ACTIVE },
    take: limit,
    orderBy: { mintedAt: 'desc' },
    include: { holder: true, landDetails: true },
  });

  return bonds.map((bond) => ({
    tdrNumber: bond.tdrNumber,
    status: bond.status,
    holderName: bond.holder?.name ?? null,
    village: bond.landDetails?.surrenderedVillage ?? null,
    surveyNumber: bond.landDetails?.surveyNumber ?? null,
    areaSqYds: bond.landDetails ? Number(bond.landDetails.surrenderedAreaSqYds) : null,
    updatedAt: bond.updatedAt,
  }));
}
