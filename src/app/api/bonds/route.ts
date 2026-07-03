import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { BondStatus } from '@prisma/client';
import { withErrorHandling, AuthenticationError } from '@/lib/errors';
import { paginated } from '@/lib/api-response';
import { getCurrentUser } from '@/lib/supabase/client';
import { prisma } from '@/lib/prisma';
import { buildDistrictScopeWhere } from '@/lib/bond-helpers';
import { isOfficialRole } from '@/types';
import { getQueueStatusForRole } from '@/lib/approval-chain';

export const GET = withErrorHandling(async (req: NextRequest) => {
  const user = await getCurrentUser(cookies());
  if (!user || !isOfficialRole(user.role)) throw new AuthenticationError();

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') ?? '1', 10);
  const limit = parseInt(searchParams.get('limit') ?? '20', 10);
  const statusFilter = searchParams.get('status') as BondStatus | null;

  const queueStatus = getQueueStatusForRole(user.role);
  const districtScope = buildDistrictScopeWhere(user.districtCode);
  const where =
    user.role === 'COMMISSIONER' || user.role === 'ADDL_COMMISSIONER'
      ? { ...(statusFilter ? { status: statusFilter } : {}) }
      : {
          status: statusFilter ?? queueStatus ?? undefined,
          ...districtScope,
        };

  const [items, total] = await Promise.all([
    prisma.tdrBond.findMany({
      where,
      include: { holder: true, landDetails: true, farmer: true },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.tdrBond.count({ where }),
  ]);

  return paginated(items, total, page, limit);
});
