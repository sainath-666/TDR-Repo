import { withErrorHandling, AuthenticationError } from '@/lib/errors';
import { ok } from '@/lib/api-response';
import { getCurrentUser } from '@/lib/supabase/client';
import { withCerbos } from '@/lib/cerbos/enforce';
import { getBondWithRelations, getEffectiveBondDistrictCode } from '@/lib/bond-helpers';
import { isOfficialRole } from '@/types';

export const GET = withErrorHandling(async (_req, { params }: { params: { bondId: string } }) => {
  const user = await getCurrentUser();
  if (!user || !isOfficialRole(user.role)) throw new AuthenticationError();

  const bond = await getBondWithRelations(params.bondId);

  await withCerbos(
    user,
    {
      kind: 'approval',
      id: params.bondId,
      attributes: { status: bond.status, districtCode: getEffectiveBondDistrictCode(bond) },
    },
    'view',
  );

  return ok(bond.approvalSteps);
});
