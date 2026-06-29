import { cookies } from 'next/headers';
import { withErrorHandling, AuthenticationError } from '@/lib/errors';
import { ok } from '@/lib/api-response';
import { getCurrentUser } from '@/lib/supabase/client';
import { withCerbos } from '@/lib/cerbos/enforce';
import { prisma } from '@/lib/prisma';
import { getBondWithRelations, getEffectiveBondDistrictCode } from '@/lib/bond-helpers';

export const GET = withErrorHandling(async (_req, { params }: { params: { bondId: string } }) => {
  const user = await getCurrentUser(cookies());
  if (!user) throw new AuthenticationError();

  const bond = await getBondWithRelations(params.bondId);

  await withCerbos(
    user,
    {
      kind: 'bond',
      id: params.bondId,
      attributes: {
        status: bond.status,
        districtCode: getEffectiveBondDistrictCode(bond),
        farmerId: bond.farmerId,
      },
    },
    'view',
  );

  const documents = await prisma.bondDocument.findMany({
    where: { bondId: params.bondId },
    orderBy: { uploadedAt: 'asc' },
  });

  return ok(documents);
});
