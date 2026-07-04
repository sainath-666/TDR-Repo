import { NextRequest } from 'next/server';
import { withErrorHandling, AuthenticationError } from '@/lib/errors';
import { ok } from '@/lib/api-response';
import { getCurrentUser } from '@/lib/supabase/client';
import { prisma } from '@/lib/prisma';
import { writeAuditLog } from '@/lib/audit';
import { getClientIp } from '@/lib/bond-helpers';

export const PUT = withErrorHandling(
  async (req: NextRequest, { params }: { params: { id: string } }) => {
    const user = await getCurrentUser();
    if (!user || user.role !== 'COMMISSIONER') throw new AuthenticationError();

    const official = await prisma.official.update({
      where: { id: params.id },
      data: { isActive: false },
    });

    await writeAuditLog({
      actorId: user.id,
      actorRole: user.role,
      action: 'OFFICIAL_DISABLED',
      details: { officialId: params.id },
      ipAddress: getClientIp(req.headers),
    });

    return ok(official);
  },
);
