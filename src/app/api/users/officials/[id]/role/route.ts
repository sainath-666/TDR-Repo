import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { OfficialRole } from '@prisma/client';
import { withErrorHandling, AuthenticationError } from '@/lib/errors';
import { ok } from '@/lib/api-response';
import { getCurrentUser } from '@/lib/supabase/client';
import { prisma } from '@/lib/prisma';
import { writeAuditLog } from '@/lib/audit';
import { getClientIp } from '@/lib/bond-helpers';

export const PUT = withErrorHandling(
  async (req: NextRequest, { params }: { params: { id: string } }) => {
    const user = await getCurrentUser(cookies());
    if (!user || user.role !== 'COMMISSIONER') throw new AuthenticationError();

    const body = z.object({ role: z.nativeEnum(OfficialRole) }).parse(await req.json());

    const official = await prisma.official.update({
      where: { id: params.id },
      data: { role: body.role },
    });

    await writeAuditLog({
      actorId: user.id,
      actorRole: user.role,
      action: 'OFFICIAL_ROLE_UPDATED',
      details: { officialId: params.id, newRole: body.role },
      ipAddress: getClientIp(req.headers),
    });

    return ok(official);
  },
);
