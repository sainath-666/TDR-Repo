import { withErrorHandling, AuthenticationError } from '@/lib/errors';
import { ok } from '@/lib/api-response';
import { getCurrentUser } from '@/lib/supabase/client';
import { prisma } from '@/lib/prisma';
import { bondInclude } from '@/lib/bond-helpers';

export const GET = withErrorHandling(async () => {
  const user = await getCurrentUser();
  if (!user || user.role !== 'FARMER') throw new AuthenticationError();

  const farmerId = user.farmerId ?? user.id;
  const bonds = await prisma.tdrBond.findMany({
    where: { farmerId },
    include: bondInclude,
    orderBy: { createdAt: 'desc' },
  });

  return ok(bonds);
});
