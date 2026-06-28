import { prisma } from '@/lib/prisma';
import { NotFoundError } from '@/lib/errors';
import type { TdrBondWithRelations } from '@/types';

export const bondInclude = {
  holder: true,
  landDetails: true,
  documents: true,
  approvalSteps: { orderBy: { level: 'asc' as const } },
  farmer: true,
  creator: true,
};

export async function getBondWithRelations(id: string): Promise<TdrBondWithRelations> {
  const bond = await prisma.tdrBond.findUnique({
    where: { id },
    include: bondInclude,
  });
  if (!bond) throw new NotFoundError('bond', id);
  return bond as TdrBondWithRelations;
}

export async function getBondDistrictCode(bondId: string): Promise<string> {
  const holder = await prisma.bondHolder.findUnique({
    where: { bondId },
    select: { district: true },
  });
  return holder?.district ?? '';
}

export function getClientIp(headers: Headers): string {
  return headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
}
