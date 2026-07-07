import { BondStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export interface PublicBondStatus {
  found: true;
  tdrNumber: string;
  status: BondStatus;
  village: string | null;
  surveyNumber: string | null;
  areaSqYds: number | null;
  ratio: string | null;
  updatedAt: string;
  mintedAt: string | null;
  rejectionReason: string | null;
  holderName: string | null;
}

export type BondStatusLookupResult = { found: false; tdrNumber: string } | PublicBondStatus;

export async function getBondStatusByTdrNumber(tdrNumber: string): Promise<BondStatusLookupResult> {
  const bond = await prisma.tdrBond.findUnique({
    where: { tdrNumber },
    include: { holder: true, landDetails: true },
  });

  if (!bond) {
    return { found: false, tdrNumber };
  }

  return {
    found: true,
    tdrNumber: bond.tdrNumber,
    status: bond.status,
    village: bond.landDetails?.surrenderedVillage ?? bond.holder?.village ?? null,
    surveyNumber: bond.landDetails?.surveyNumber ?? null,
    areaSqYds: bond.landDetails ? Number(bond.landDetails.tdrIssuedExtentSqYds) : null,
    ratio: bond.landDetails?.issuedRatio ?? null,
    updatedAt: bond.updatedAt.toISOString(),
    mintedAt: bond.mintedAt?.toISOString() ?? null,
    rejectionReason: bond.rejectionReason,
    holderName: bond.status === BondStatus.ACTIVE ? (bond.holder?.name ?? null) : null,
  };
}
