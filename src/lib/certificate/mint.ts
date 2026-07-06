import fs from 'fs/promises';
import path from 'path';
import QRCode from 'qrcode';
import { BondStatus } from '@prisma/client';
import type { TdrBondWithRelations } from '@/types';
import type { UserRole } from '@/types';
import { ValidationError } from '@/lib/errors';
import { writeAuditLog } from '@/lib/audit';
import { getBondWithRelations } from '@/lib/bond-helpers';
import { prisma } from '@/lib/prisma';
import * as fabric from '@/lib/fabric/gateway';
import { isFabricMockMode } from '@/lib/fabric/gateway';
import { generateCertificatePdf } from '@/lib/pdf/certificate';
import { buildCertificateRenderData } from '@/lib/certificate/render-data';
import { generateApprovalSignature } from '@/lib/security/hmac';
import {
  downloadCertificatePdf,
  isLegacyLocalCertificatePath,
  uploadCertificatePdf,
} from '@/lib/supabase/storage';

export interface MintedCertificate {
  certificateIpfsCid: string;
  certificateStoragePath: string;
  fabricTxId: string;
  pdfSize: number;
}

function legacyCertificateAbsolutePath(storagePath: string): string {
  return path.join(process.cwd(), storagePath.replace(/^\//, ''));
}

function assertBondReadyForCertificate(bond: TdrBondWithRelations): void {
  if (!bond.holder) throw new ValidationError('Holder details required before certificate mint');
  if (!bond.landDetails) throw new ValidationError('Land details required before certificate mint');
}

/** Build a fresh PDF from current bond data (same source as the on-screen preview). */
export async function generateBondCertificatePdfBuffer(
  bond: TdrBondWithRelations,
  verifyOrigin: string,
  actorRole: UserRole = 'COMMISSIONER',
  approvalFabricTxId?: string | null,
): Promise<Buffer> {
  assertBondReadyForCertificate(bond);

  const data = buildCertificateRenderData(bond, { actorRole, approvalFabricTxId });
  if (!data) throw new ValidationError('Certificate data incomplete');

  const verifyUrl = `${verifyOrigin}/verify/${bond.tdrNumber}`;
  const qrBuffer = await QRCode.toBuffer(verifyUrl);
  return generateCertificatePdf(data, qrBuffer);
}

/** Generate PDF, upload to Supabase Storage, and return mint metadata (no DB write). */
export async function prepareBondCertificate(params: {
  bond: TdrBondWithRelations;
  actorRole: UserRole;
  employeeId?: string;
  verifyOrigin: string;
  approvalFabricTxId?: string | null;
}): Promise<MintedCertificate> {
  const pdfBuffer = await generateBondCertificatePdfBuffer(
    params.bond,
    params.verifyOrigin,
    params.actorRole,
    params.approvalFabricTxId,
  );

  const uploaded = await uploadCertificatePdf(params.bond.id, pdfBuffer);

  const commissionerHash = params.employeeId
    ? generateApprovalSignature(params.employeeId, params.bond.id, 'CERT', Date.now())
    : 'unsigned-dev';

  const fabricTxId =
    (await fabric.ensureMintCertificate(
      params.bond.tdrNumber,
      uploaded.contentHash,
      commissionerHash,
    )) ??
    params.approvalFabricTxId ??
    `ledger-synced-cert-${params.bond.tdrNumber}`;

  return {
    certificateIpfsCid: uploaded.contentHash,
    certificateStoragePath: uploaded.storagePath,
    fabricTxId,
    pdfSize: pdfBuffer.length,
  };
}

/** Load archived certificate PDF from storage (legacy / audit copy). */
export async function readBondCertificatePdf(
  bondId: string,
  storagePath?: string | null,
): Promise<Buffer> {
  if (!storagePath) {
    throw new ValidationError('Certificate file not found');
  }

  if (isLegacyLocalCertificatePath(storagePath)) {
    try {
      return await fs.readFile(legacyCertificateAbsolutePath(storagePath));
    } catch {
      throw new ValidationError('Certificate file not found');
    }
  }

  try {
    return await downloadCertificatePdf(storagePath);
  } catch {
    throw new ValidationError('Certificate file not found');
  }
}

/** Backfill PDF certificate for ACTIVE bonds (e.g. approved before auto-mint). */
export async function ensureFarmerBondCertificate(
  bondId: string,
  verifyOrigin: string,
): Promise<void> {
  const bond = await getBondWithRelations(bondId);
  if (bond.status !== BondStatus.ACTIVE) return;
  if (bond.certificateStoragePath && bond.certificateIpfsCid) return;
  if (!bond.holder || !bond.landDetails) return;

  const minted = await prepareBondCertificate({
    bond,
    actorRole: 'COMMISSIONER',
    verifyOrigin,
    approvalFabricTxId: bond.fabricTxId,
  });

  await prisma.tdrBond.update({
    where: { id: bondId },
    data: {
      certificateIpfsCid: minted.certificateIpfsCid,
      certificateStoragePath: minted.certificateStoragePath,
      mintedAt: bond.mintedAt ?? new Date(),
      fabricTxId: minted.fabricTxId,
    },
  });
}

export async function mintBondCertificateAfterApproval(params: {
  bondId: string;
  actorId: string;
  actorRole: UserRole;
  employeeId?: string;
  verifyOrigin: string;
  approvalFabricTxId?: string | null;
  cerbosCallId?: string;
  ipAddress?: string;
}): Promise<MintedCertificate> {
  const bond = await getBondWithRelations(params.bondId);

  if (bond.certificateStoragePath && bond.certificateIpfsCid) {
    return {
      certificateIpfsCid: bond.certificateIpfsCid,
      certificateStoragePath: bond.certificateStoragePath,
      fabricTxId: bond.fabricTxId ?? 'existing',
      pdfSize: 0,
    };
  }

  const minted = await prepareBondCertificate({
    bond,
    actorRole: params.actorRole,
    employeeId: params.employeeId,
    verifyOrigin: params.verifyOrigin,
    approvalFabricTxId: params.approvalFabricTxId,
  });

  await writeAuditLog({
    bondId: params.bondId,
    actorId: params.actorId,
    actorRole: params.actorRole,
    action: 'CERT_MINTED',
    details: {
      certificateIpfsCid: minted.certificateIpfsCid,
      pdfSize: minted.pdfSize,
      blockchainPending: isFabricMockMode(),
    },
    cerbosCallId: params.cerbosCallId,
    fabricTxId: minted.fabricTxId,
    ipAddress: params.ipAddress,
  });

  return minted;
}
