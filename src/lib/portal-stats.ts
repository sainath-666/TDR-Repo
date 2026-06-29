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

export interface TdrBankEntry {
  tdrNumber: string;
  holderName: string | null;
  siteAddress: string | null;
  extentIssuedSqYds: number | null;
  balanceSqYds: number | null;
  status: BondStatus;
}

export async function getTdrBankEntries(): Promise<TdrBankEntry[]> {
  const bonds = await prisma.tdrBond.findMany({
    where: { status: { not: BondStatus.DRAFT } },
    orderBy: { updatedAt: 'desc' },
    include: { holder: true, landDetails: true },
  });

  return bonds.map((bond) => {
    const extent = bond.landDetails ? Number(bond.landDetails.tdrIssuedExtentSqYds) : null;
    const addressParts = [
      bond.holder?.doorNo,
      bond.holder?.street,
      bond.holder?.village,
      bond.holder?.mandal,
    ].filter(Boolean);

    return {
      tdrNumber: bond.tdrNumber,
      holderName: bond.holder?.name ?? null,
      siteAddress:
        addressParts.length > 0
          ? addressParts.join(', ')
          : (bond.landDetails?.surrenderedVillage ?? null),
      extentIssuedSqYds: extent,
      balanceSqYds: bond.status === BondStatus.ACTIVE ? extent : 0,
      status: bond.status,
    };
  });
}

export async function getEntitlementEntries(limit = 50): Promise<PublicBondSummary[]> {
  const bonds = await prisma.tdrBond.findMany({
    where: { status: { not: BondStatus.DRAFT } },
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
    areaSqYds: bond.landDetails ? Number(bond.landDetails.tdrIssuedExtentSqYds) : null,
    updatedAt: bond.updatedAt,
  }));
}

export async function getVerifiableBonds(limit = 10): Promise<PublicBondSummary[]> {
  return getEntitlementEntries(limit);
}
