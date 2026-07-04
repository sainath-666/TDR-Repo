import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withErrorHandling, AuthenticationError } from '@/lib/errors';
import { ok } from '@/lib/api-response';
import { getCurrentUser } from '@/lib/supabase/client';
import { prisma } from '@/lib/prisma';
import { writeAuditLog } from '@/lib/audit';
import { getClientIp } from '@/lib/bond-helpers';

export const GET = withErrorHandling(async (_req, { params }: { params: { id: string } }) => {
  const user = await getCurrentUser();
  if (
    !user ||
    !['SDC', 'DIRECTOR_LANDS', 'COMMISSIONER', 'ADDL_COMMISSIONER'].includes(user.role)
  ) {
    throw new AuthenticationError();
  }

  const farmer = await prisma.farmer.findUnique({
    where: { id: params.id },
    include: { bonds: { select: { id: true, tdrNumber: true, status: true } } },
  });

  return ok(farmer);
});

export const PUT = withErrorHandling(
  async (req: NextRequest, { params }: { params: { id: string } }) => {
    const user = await getCurrentUser();
    if (!user || user.role !== 'SDC') throw new AuthenticationError();

    const body = z.object({ aadhaarPhone: z.string().regex(/^\d{10}$/) }).parse(await req.json());

    const farmer = await prisma.farmer.update({
      where: { id: params.id },
      data: { aadhaarPhone: body.aadhaarPhone },
    });

    await writeAuditLog({
      actorId: user.id,
      actorRole: user.role,
      action: 'FARMER_PHONE_UPDATED',
      details: { farmerId: params.id },
      ipAddress: getClientIp(req.headers),
    });

    return ok(farmer);
  },
);
