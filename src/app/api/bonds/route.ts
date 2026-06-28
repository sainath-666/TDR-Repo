import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { BondStatus, ApprovalDecision } from '@prisma/client';
import { withErrorHandling, AuthenticationError, ValidationError } from '@/lib/errors';
import { ok, created, paginated } from '@/lib/api-response';
import { getCurrentUser } from '@/lib/supabase/client';
import { withCerbos } from '@/lib/cerbos/enforce';
import { prisma, withTransaction } from '@/lib/prisma';
import { writeAuditLog } from '@/lib/audit';
import { createBondSchema } from '@/lib/validations/bond';
import { hashAadhaar, encryptAadhaar } from '@/lib/security/hmac';
import { getClientIp } from '@/lib/bond-helpers';
import { isOfficialRole, getQueueStatusForRole } from '@/types';
import { APPROVAL_LEVELS } from '@/lib/bond-state-machine';

export const POST = withErrorHandling(async (req: NextRequest) => {
  const user = await getCurrentUser(cookies());
  if (!user) throw new AuthenticationError();

  const data = createBondSchema.parse(await req.json());

  const cerbosCallId = await withCerbos(
    user,
    { kind: 'bond', id: 'new', attributes: {} },
    'create',
  );

  const aadhaarHash = hashAadhaar(data.aadhaarNumber);
  const aadhaarEncrypted = encryptAadhaar(data.aadhaarNumber);

  let farmer = await prisma.farmer.findFirst({
    where: { OR: [{ aadhaarPhone: data.aadhaarPhone }, { aadhaarHash }] },
  });

  if (!farmer) {
    farmer = await prisma.farmer.create({
      data: {
        id: crypto.randomUUID(),
        name: data.name,
        aadhaarHash,
        aadhaarPhone: data.aadhaarPhone,
      },
    });
  }

  const bond = await withTransaction(async (tx) => {
    const newBond = await tx.tdrBond.create({
      data: {
        tdrNumber: data.tdrNumber,
        status: BondStatus.DRAFT,
        farmerId: farmer!.id,
        createdBy: user.id,
        holder: {
          create: {
            name: data.name,
            relationType: data.relationType,
            relationName: data.relationName,
            aadhaarHash,
            aadhaarEncrypted,
            aadhaarPhone: data.aadhaarPhone,
            email: data.email || null,
            doorNo: data.doorNo,
            street: data.street,
            village: data.village,
            mandal: data.mandal,
            district: data.district,
          },
        },
        approvalSteps: {
          create: APPROVAL_LEVELS.map((step) => ({
            level: step.level,
            role: step.role,
            decision: ApprovalDecision.PENDING,
          })),
        },
      },
      include: { holder: true, approvalSteps: true },
    });
    return newBond;
  });

  // AUDIT: Records new bond creation by DEO
  await writeAuditLog({
    bondId: bond.id,
    actorId: user.id,
    actorRole: user.role,
    action: 'BOND_CREATED',
    details: { tdrNumber: data.tdrNumber },
    cerbosCallId,
    ipAddress: getClientIp(req.headers),
  });

  return created({ bondId: bond.id, tdrNumber: bond.tdrNumber, status: bond.status });
});

export const GET = withErrorHandling(async (req: NextRequest) => {
  const user = await getCurrentUser(cookies());
  if (!user || !isOfficialRole(user.role)) throw new AuthenticationError();

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') ?? '1', 10);
  const limit = parseInt(searchParams.get('limit') ?? '20', 10);
  const statusFilter = searchParams.get('status') as BondStatus | null;

  const queueStatus = getQueueStatusForRole(user.role);
  const where =
    user.role === 'COMMISSIONER' || user.role === 'ADDL_COMMISSIONER'
      ? { ...(statusFilter ? { status: statusFilter } : {}) }
      : {
          status: statusFilter ?? queueStatus ?? undefined,
          holder: user.districtCode ? { district: user.districtCode } : undefined,
        };

  const [items, total] = await Promise.all([
    prisma.tdrBond.findMany({
      where,
      include: { holder: true, landDetails: true, farmer: true },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.tdrBond.count({ where }),
  ]);

  return paginated(items, total, page, limit);
});
