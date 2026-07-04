import { BondStatus } from '@prisma/client';
import { withErrorHandling, AuthenticationError } from '@/lib/errors';
import { ok } from '@/lib/api-response';
import { getCurrentUser } from '@/lib/supabase/client';
import { prisma } from '@/lib/prisma';

export const GET = withErrorHandling(async () => {
  const user = await getCurrentUser();
  if (!user || (user.role !== 'COMMISSIONER' && user.role !== 'ADDL_COMMISSIONER')) {
    throw new AuthenticationError();
  }

  const stats = await prisma.tdrBond.groupBy({
    by: ['status'],
    _count: { id: true },
  });

  const pendingStatuses: BondStatus[] = [
    BondStatus.PENDING_L1,
    BondStatus.PENDING_L2,
    BondStatus.PENDING_L3,
    BondStatus.PENDING_L4,
  ];

  const pending = stats
    .filter((s) => pendingStatuses.includes(s.status))
    .reduce((sum, s) => sum + s._count.id, 0);

  return ok({
    total: stats.reduce((sum, s) => sum + s._count.id, 0),
    pending,
    active: stats.find((s) => s.status === BondStatus.ACTIVE)?._count.id ?? 0,
    rejected: stats.find((s) => s.status === BondStatus.REJECTED)?._count.id ?? 0,
    byStatus: stats,
  });
});
