import { prisma } from '@/lib/prisma';
import { NotFoundError } from '@/lib/errors';
import type { Prisma } from '@prisma/client';
import type { TdrBondWithRelations } from '@/types';

export const bondInclude = {
  holder: true,
  landDetails: true,
  documents: {
    select: {
      id: true,
      docType: true,
      fileName: true,
      fileSizeKb: true,
      uploadedAt: true,
      ipfsCid: true,
    },
  },
  approvalSteps: {
    orderBy: { level: 'asc' as const },
    include: { official: { select: { id: true, name: true } } },
  },
};

/** District used for queue filters and Cerbos — from holder address. */
export function getEffectiveBondDistrictCode(bond: {
  holder?: { district: string } | null;
}): string {
  return bond.holder?.district ?? '';
}

/** Prisma filter: bonds in an official's district. */
export function buildDistrictScopeWhere(
  districtCode?: string,
): Prisma.TdrBondWhereInput | undefined {
  if (!districtCode || districtCode === 'ALL') return undefined;
  return { holder: { district: districtCode } };
}

export async function getBondWithRelations(id: string): Promise<TdrBondWithRelations> {
  const bond = await prisma.tdrBond.findUnique({
    where: { id },
    include: bondInclude,
  });
  if (!bond) throw new NotFoundError('bond', id);
  return bond;
}

export async function getBondDistrictCode(bondId: string): Promise<string> {
  const bond = await prisma.tdrBond.findUnique({
    where: { id: bondId },
    include: { holder: true },
  });
  if (!bond) return '';
  return getEffectiveBondDistrictCode(bond);
}

export function getClientIp(headers: Headers): string {
  return headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
}
