import { BondStatus, TdrStatusCheckRequestStatus } from '@prisma/client';
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

export interface ExistingStatusCheckRequest {
  referenceId: string;
  status: TdrStatusCheckRequestStatus;
  submittedAt: string;
}

export type BondStatusLookupResult =
  | PublicBondStatus
  | { found: false; tdrNumber: string; existingRequest: ExistingStatusCheckRequest | null };

export async function getBondStatusByTdrNumber(tdrNumber: string): Promise<BondStatusLookupResult> {
  const bond = await prisma.tdrBond.findUnique({
    where: { tdrNumber },
    include: { holder: true, landDetails: true },
  });

  if (!bond) {
    const existingRequest = await prisma.tdrStatusCheckRequest.findFirst({
      where: {
        tdrNumber: { equals: tdrNumber, mode: 'insensitive' },
      },
      orderBy: { createdAt: 'desc' },
      select: {
        referenceId: true,
        status: true,
        createdAt: true,
      },
    });

    return {
      found: false,
      tdrNumber,
      existingRequest: existingRequest
        ? {
            referenceId: existingRequest.referenceId,
            status: existingRequest.status,
            submittedAt: existingRequest.createdAt.toISOString(),
          }
        : null,
    };
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
