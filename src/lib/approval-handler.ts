import { revalidatePath } from 'next/cache';
import { NextRequest } from 'next/server';
import { ApprovalDecision, BondStatus } from '@prisma/client';
import { AuthenticationError, ValidationError } from '@/lib/errors';
import { getCurrentUser } from '@/lib/supabase/client';
import { withCerbos } from '@/lib/cerbos/enforce';
import { prisma, withTransaction } from '@/lib/prisma';
import { writeAuditLog } from '@/lib/audit';
import { generateApprovalSignature } from '@/lib/security/hmac';
import {
  getBondWithRelations,
  getClientIp,
  getEffectiveBondDistrictCode,
} from '@/lib/bond-helpers';
import { getExpectedLevel, validateTransition, mapDecisionToEvent } from '@/lib/bond-state-machine';
import * as fabric from '@/lib/fabric/gateway';
import { isOfficialRole } from '@/types';
import type { UserRole } from '@/types';
import { prepareBondCertificate } from '@/lib/certificate/mint';

interface ProcessApprovalParams {
  bondId: string;
  decision: ApprovalDecision;
  remarks?: string;
  req: NextRequest;
}

function revalidateDashboardPages(): void {
  revalidatePath('/deo/dashboard');
  revalidatePath('/official/dashboard');
  revalidatePath('/farmer/dashboard');
}

async function processIntakeReview({
  bondId,
  decision,
  remarks,
  req,
  user,
  bond,
  districtCode,
}: {
  bondId: string;
  decision: ApprovalDecision;
  remarks?: string;
  req: NextRequest;
  user: { id: string; role: UserRole; employeeId?: string };
  bond: Awaited<ReturnType<typeof getBondWithRelations>>;
  districtCode: string;
}) {
  if (bond.status !== BondStatus.DRAFT) {
    throw new ValidationError('Intake review only applies to DRAFT bonds');
  }
  if (decision === ApprovalDecision.RETURNED) {
    throw new ValidationError('Return is not available during intake review');
  }

  const action = decision === ApprovalDecision.APPROVED ? 'approve' : 'reject';
  const event = mapDecisionToEvent(decision);
  const newStatus = validateTransition(bond.status, event, user.role);

  const cerbosCallId = await withCerbos(
    user,
    {
      kind: 'approval',
      id: bondId,
      attributes: { status: bond.status, districtCode },
    },
    action,
  );

  let fabricTxId: string | undefined;
  if (decision === ApprovalDecision.APPROVED) {
    if (!bond.landDetails) throw new ValidationError('Land details required before approval');
    if (!bond.holder) throw new ValidationError('Holder details required before approval');

    fabricTxId = await fabric.ensureBondOnChain(fabricBondParamsFromRecord(bond));
  }

  await prisma.tdrBond.update({
    where: { id: bondId },
    data: {
      status: newStatus,
      ...(fabricTxId ? { fabricTxId } : {}),
      ...(decision === ApprovalDecision.REJECTED && remarks ? { rejectionReason: remarks } : {}),
    },
  });

  const auditAction =
    decision === ApprovalDecision.APPROVED ? 'INTAKE_APPROVED' : 'INTAKE_REJECTED';

  // AUDIT: Records DEO intake review of externally synced bond before pipeline entry
  await writeAuditLog({
    bondId,
    actorId: user.id,
    actorRole: user.role,
    action: auditAction,
    details: { decision, remarks },
    cerbosCallId,
    fabricTxId,
    ipAddress: getClientIp(req.headers),
  });

  revalidateDashboardPages();

  return { newStatus, cerbosCallId, fabricTxId, level: 0 };
}

function fabricBondParamsFromRecord(
  bond: Awaited<ReturnType<typeof getBondWithRelations>>,
): fabric.FabricBondParams {
  if (!bond.landDetails || !bond.holder) {
    throw new ValidationError('Land and holder details required for blockchain registration');
  }
  return {
    tdrNumber: bond.tdrNumber,
    surveyNumber: bond.landDetails.surveyNumber,
    holderAadhaarHash: bond.holder.aadhaarHash,
    extentSqYds: Number(bond.landDetails.tdrIssuedExtentSqYds),
    ratio: bond.landDetails.issuedRatio,
    ipfsDocCid: bond.documents[0]?.ipfsCid ?? '',
  };
}

export async function processApproval({ bondId, decision, remarks, req }: ProcessApprovalParams) {
  const user = await getCurrentUser();
  if (!user || !isOfficialRole(user.role)) throw new AuthenticationError();

  const bond = await getBondWithRelations(bondId);
  const districtCode = getEffectiveBondDistrictCode(bond);

  if (bond.status === BondStatus.DRAFT) {
    return processIntakeReview({
      bondId,
      decision,
      remarks,
      req,
      user,
      bond,
      districtCode,
    });
  }

  const level = getExpectedLevel(bond.status);
  if (!level) throw new ValidationError(`Bond cannot be approved in status ${bond.status}`);

  const action =
    decision === ApprovalDecision.APPROVED
      ? 'approve'
      : decision === ApprovalDecision.REJECTED
        ? 'reject'
        : 'return';

  const event = mapDecisionToEvent(decision);
  const newStatus = validateTransition(bond.status, event, user.role as UserRole);

  const cerbosCallId = await withCerbos(
    user,
    {
      kind: 'approval',
      id: bondId,
      attributes: { status: bond.status, districtCode },
    },
    action,
  );

  const timestamp = Date.now();
  const signatureHash = user.employeeId
    ? generateApprovalSignature(user.employeeId, bondId, decision, timestamp)
    : undefined;

  await fabric.ensureBondOnChain(fabricBondParamsFromRecord(bond));

  const fabricTxId =
    (await fabric.ensureRecordApproval({
      tdrNumber: bond.tdrNumber,
      level,
      decision,
      employeeId: user.employeeId ?? user.id,
      signatureHash: signatureHash ?? '',
      cerbosCallId,
      remarks: remarks ?? '',
    })) ?? bond.fabricTxId ?? undefined;

  let certificateFields: {
    certificateIpfsCid: string;
    certificateStoragePath: string;
    mintedAt: Date;
  } | null = null;
  let bondFabricTxId = fabricTxId;

  if (
    decision === ApprovalDecision.APPROVED &&
    newStatus === BondStatus.ACTIVE &&
    bond.status === BondStatus.PENDING_L4
  ) {
    const minted = await prepareBondCertificate({
      bond,
      actorRole: user.role,
      employeeId: user.employeeId,
      verifyOrigin: new URL(req.url).origin,
      approvalFabricTxId: fabricTxId,
    });
    certificateFields = {
      certificateIpfsCid: minted.certificateIpfsCid,
      certificateStoragePath: minted.certificateStoragePath,
      mintedAt: new Date(),
    };
    bondFabricTxId = minted.fabricTxId;
  }

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
        fabricTxId: bondFabricTxId,
        ...(decision === ApprovalDecision.REJECTED && remarks ? { rejectionReason: remarks } : {}),
        ...(certificateFields ?? {}),
      },
    });
  });

  const auditAction =
    decision === ApprovalDecision.APPROVED
      ? `L${level}_APPROVED`
      : decision === ApprovalDecision.REJECTED
        ? `L${level}_REJECTED`
        : `L${level}_RETURNED`;

  const ipAddress = getClientIp(req.headers);

  // AUDIT: Records approval chain decision with Cerbos and Fabric join keys
  // Chain hash requires sequential writes — keep order, but do not block on cache revalidation.
  await writeAuditLog({
    bondId,
    actorId: user.id,
    actorRole: user.role,
    action: auditAction,
    details: { level, decision, remarks },
    cerbosCallId,
    fabricTxId: bondFabricTxId,
    ipAddress,
  });

  if (certificateFields) {
    // AUDIT: Records TDR certificate PDF mint after commissioner final approval
    await writeAuditLog({
      bondId,
      actorId: user.id,
      actorRole: user.role,
      action: 'CERT_MINTED',
      details: {
        certificateIpfsCid: certificateFields.certificateIpfsCid,
        blockchainPending: true,
      },
      cerbosCallId,
      fabricTxId: bondFabricTxId,
      ipAddress,
    });
  }

  revalidateDashboardPages();

  return { newStatus, signatureHash, cerbosCallId, fabricTxId: bondFabricTxId, level };
}
