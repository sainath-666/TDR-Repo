import { cookies } from 'next/headers';
import { BondStatus } from '@prisma/client';
import { withErrorHandling, AuthenticationError } from '@/lib/errors';
import { ok } from '@/lib/api-response';
import { getCurrentUser } from '@/lib/supabase/client';
import { prisma } from '@/lib/prisma';
import { isOfficialRole } from '@/types';

export const GET = withErrorHandling(async () => {
  const user = await getCurrentUser(cookies());
  if (!user || !isOfficialRole(user.role)) throw new AuthenticationError();

  const statusMap: Partial<Record<string, BondStatus>> = {
    DY_TAHSILDAR: BondStatus.PENDING_L1,
    TAHSILDAR: BondStatus.PENDING_L1,
    SDC: BondStatus.PENDING_L2,
    DIRECTOR_LANDS: BondStatus.PENDING_L3,
    COMMISSIONER: BondStatus.PENDING_L4,
    ADDL_COMMISSIONER: BondStatus.PENDING_L4,
  };

  const status = statusMap[user.role];
  const where =
    user.role === 'COMMISSIONER' || user.role === 'ADDL_COMMISSIONER'
      ? { status: BondStatus.PENDING_L4 }
      : {
          status,
          holder: user.districtCode ? { district: user.districtCode } : undefined,
        };

  const bonds = await prisma.tdrBond.findMany({
    where,
    include: { holder: true, landDetails: true, farmer: true },
    orderBy: { updatedAt: 'asc' },
  });

  return ok(bonds);
});
