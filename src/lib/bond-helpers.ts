import { prisma } from '@/lib/prisma';
import { NotFoundError } from '@/lib/errors';
import type { Prisma } from '@prisma/client';
import type { TdrBondWithRelations } from '@/types';

export const bondInclude = {
  holder: true,
  landDetails: true,
  documents: true,
  approvalSteps: { orderBy: { level: 'asc' as const } },
  farmer: true,
  creator: true,
};

/** District used for queue filters and Cerbos — prefers creating official's district code. */
export function getEffectiveBondDistrictCode(bond: {
  holder?: { district: string } | null;
  creator?: { districtCode: string } | null;
}): string {
  const creatorDistrict = bond.creator?.districtCode;
  if (creatorDistrict && creatorDistrict !== 'ALL') {
    return creatorDistrict;
  }
  return bond.holder?.district ?? '';
}

/** Prisma filter: bonds in an official's district (holder or creator). */
export function buildDistrictScopeWhere(
  districtCode?: string,
): Prisma.TdrBondWhereInput | undefined {
  if (!districtCode || districtCode === 'ALL') return undefined;
  return {
    OR: [{ holder: { district: districtCode } }, { creator: { districtCode } }],
  };
}

export async function getBondWithRelations(id: string): Promise<TdrBondWithRelations> {
  const bond = await prisma.tdrBond.findUnique({
    where: { id },
    include: bondInclude,
  });
  if (!bond) throw new NotFoundError('bond', id);
  return bond as TdrBondWithRelations;
}

export async function getBondDistrictCode(bondId: string): Promise<string> {
  const bond = await prisma.tdrBond.findUnique({
    where: { id: bondId },
    include: { holder: true, creator: true },
  });
  if (!bond) return '';
  return getEffectiveBondDistrictCode(bond);
}

export function getClientIp(headers: Headers): string {
  return headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
}
