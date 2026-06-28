import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { ApprovalDecision, BondStatus } from '@prisma/client';
import { withErrorHandling, AuthenticationError, ValidationError } from '@/lib/errors';
import { getCurrentUser } from '@/lib/supabase/client';
import { withCerbos } from '@/lib/cerbos/enforce';
import { prisma, withTransaction } from '@/lib/prisma';
import { writeAuditLog } from '@/lib/audit';
import { generateApprovalSignature } from '@/lib/security/hmac';
import { getBondWithRelations, getClientIp } from '@/lib/bond-helpers';
import { getExpectedLevel, validateTransition, mapDecisionToEvent } from '@/lib/bond-state-machine';
import * as fabric from '@/lib/fabric/gateway';
import { isOfficialRole } from '@/types';
import type { UserRole } from '@/types';

interface ProcessApprovalParams {
  bondId: string;
  decision: ApprovalDecision;
  remarks?: string;
  otp?: string;
  req: NextRequest;
}

export async function processApproval({
  bondId,
  decision,
  remarks,
  otp,
  req,
}: ProcessApprovalParams) {
  const user = await getCurrentUser(cookies());
  if (!user || !isOfficialRole(user.role)) throw new AuthenticationError();

  const bond = await getBondWithRelations(bondId);
  const districtCode = bond.holder?.district ?? '';
  const level = getExpectedLevel(bond.status);

  if (!level) throw new ValidationError(`Bond cannot be approved in status ${bond.status}`);

  const action =
    decision === ApprovalDecision.APPROVED
      ? 'approve'
      : decision === ApprovalDecision.REJECTED
        ? 'reject'
        : 'return';

  const cerbosCallId = await withCerbos(
    user,
    {
      kind: 'approval',
      id: bondId,
      attributes: { status: bond.status, districtCode },
    },
    action,
  );

  if (decision !== ApprovalDecision.RETURNED) {
    if (!otp) throw new AuthenticationError('OTP required');
    const otpRecord = await prisma.otpRequest.findFirst({
      where: {
        userId: user.id,
        purpose: 'APPROVAL',
        used: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });
    if (!otpRecord) throw new AuthenticationError('OTP expired or not found');
    const valid = await bcrypt.compare(otp, otpRecord.otpHash);
    if (!valid) throw new AuthenticationError('Invalid OTP');
    await prisma.otpRequest.update({ where: { id: otpRecord.id }, data: { used: true } });
  }

  const event = mapDecisionToEvent(decision);
  const newStatus = validateTransition(bond.status, event, user.role as UserRole);
  const timestamp = Date.now();
  const signatureHash = user.employeeId
    ? generateApprovalSignature(user.employeeId, bondId, decision, timestamp)
    : undefined;

  const fabricTxId = await fabric.recordApproval({
    tdrNumber: bond.tdrNumber,
    level,
    decision,
    employeeId: user.employeeId ?? user.id,
    signatureHash: signatureHash ?? '',
    cerbosCallId,
    remarks: remarks ?? '',
  });

  await withTransaction(async (tx) => {
    await tx.approvalStep.update({
      where: { bondId_level: { bondId, level } },
      data: {
        decision,
        officialId: user.id,
        signatureHash,
        cerbosCallId,
        fabricTxId,
        remarks,
        decidedAt: new Date(),
      },
    });

    await tx.tdrBond.update({
      where: { id: bondId },
      data: {
        status: newStatus,
        ...(decision === ApprovalDecision.REJECTED && remarks ? { rejectionReason: remarks } : {}),
      },
    });
  });

  const auditAction =
    decision === ApprovalDecision.APPROVED
      ? `L${level}_APPROVED`
      : decision === ApprovalDecision.REJECTED
        ? `L${level}_REJECTED`
        : `L${level}_RETURNED`;

  // AUDIT: Records approval chain decision with Cerbos and Fabric join keys
  await writeAuditLog({
    bondId,
    actorId: user.id,
    actorRole: user.role,
    action: auditAction,
    details: { level, decision, remarks },
    cerbosCallId,
    fabricTxId,
    ipAddress: getClientIp(req.headers),
  });

  return { newStatus, signatureHash, cerbosCallId, fabricTxId, level };
}
