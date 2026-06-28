import { cookies } from 'next/headers';
import { BondStatus } from '@prisma/client';
import { withErrorHandling, AuthenticationError, ValidationError } from '@/lib/errors';
import { ok } from '@/lib/api-response';
import { getCurrentUser } from '@/lib/supabase/client';
import { withCerbos } from '@/lib/cerbos/enforce';
import { getBondWithRelations } from '@/lib/bond-helpers';
import { writeAuditLog } from '@/lib/audit';
import { NextRequest } from 'next/server';
import { getClientIp } from '@/lib/bond-helpers';

export const GET = withErrorHandling(
  async (req: NextRequest, { params }: { params: { bondId: string } }) => {
    const user = await getCurrentUser(cookies());
    if (!user) throw new AuthenticationError();

    const bond = await getBondWithRelations(params.bondId);

    await withCerbos(
      user,
      {
        kind: 'certificate',
        id: params.bondId,
        attributes: { bondStatus: bond.status, farmerId: bond.farmerId },
      },
      'download',
    );

    if (bond.status !== BondStatus.ACTIVE || !bond.certificateIpfsCid) {
      throw new ValidationError('Certificate not available');
    }

    await writeAuditLog({
      bondId: params.bondId,
      actorId: user.id,
      actorRole: user.role,
      action: 'CERT_DOWNLOADED',
      ipAddress: getClientIp(req.headers),
    });

    return ok({
      downloadUrl: `/api/certificates/${params.bondId}/verify`,
      certificateIpfsCid: bond.certificateIpfsCid,
      tdrNumber: bond.tdrNumber,
    });
  },
);
