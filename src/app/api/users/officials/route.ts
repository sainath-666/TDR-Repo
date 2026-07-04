import { NextRequest } from 'next/server';
import { z } from 'zod';
import { OfficialRole } from '@prisma/client';
import { withErrorHandling, AuthenticationError } from '@/lib/errors';
import { ok, created } from '@/lib/api-response';
import { getCurrentUser } from '@/lib/supabase/client';
import { prisma } from '@/lib/prisma';
import { writeAuditLog } from '@/lib/audit';
import { getClientIp } from '@/lib/bond-helpers';

const createOfficialSchema = z.object({
  id: z.string().uuid(),
  employeeId: z.string(),
  name: z.string(),
  role: z.nativeEnum(OfficialRole),
  districtCode: z.string(),
  phone: z.string().regex(/^\d{10}$/),
});

export const GET = withErrorHandling(async () => {
  const user = await getCurrentUser();
  if (!user || (user.role !== 'COMMISSIONER' && user.role !== 'ADDL_COMMISSIONER')) {
    throw new AuthenticationError();
  }

  const officials = await prisma.official.findMany({ orderBy: { name: 'asc' } });
  return ok(officials);
});

export const POST = withErrorHandling(async (req: NextRequest) => {
  const user = await getCurrentUser();
  if (!user || user.role !== 'COMMISSIONER') throw new AuthenticationError();

  const data = createOfficialSchema.parse(await req.json());
  const official = await prisma.official.create({ data });

  await writeAuditLog({
    actorId: user.id,
    actorRole: user.role,
    action: 'OFFICIAL_CREATED',
    details: { employeeId: data.employeeId, role: data.role },
    ipAddress: getClientIp(req.headers),
  });

  return created(official);
});
