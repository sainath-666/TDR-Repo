import { withErrorHandling, AuthenticationError } from '@/lib/errors';
import { ok } from '@/lib/api-response';
import { getCurrentUser } from '@/lib/supabase/client';
import { withCerbos } from '@/lib/cerbos/enforce';
import { getBondWithRelations, getEffectiveBondDistrictCode } from '@/lib/bond-helpers';

export const GET = withErrorHandling(async (_req, { params }: { params: { id: string } }) => {
  const user = await getCurrentUser();
  if (!user) throw new AuthenticationError();

  const bond = await getBondWithRelations(params.id);
  const districtCode = getEffectiveBondDistrictCode(bond);

  await withCerbos(
    user,
    {
      kind: 'bond',
      id: bond.id,
      attributes: {
        status: bond.status,
        districtCode,
        farmerId: bond.farmerId,
      },
    },
    'view',
  );

  return ok(bond);
});

export const dynamic = 'force-dynamic';
