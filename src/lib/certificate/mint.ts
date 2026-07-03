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
import { decryptAadhaar, generateApprovalSignature } from '@/lib/security/hmac';

const CERT_RELATIVE_DIR = path.join('storage', 'certificates');

export interface MintedCertificate {
  certificateIpfsCid: string;
  certificateStoragePath: string;
  fabricTxId: string;
  pdfSize: number;
}

function certificateAbsolutePath(bondId: string): string {
  return path.join(process.cwd(), CERT_RELATIVE_DIR, `${bondId}.pdf`);
}

function certificateRelativePath(bondId: string): string {
  return path.join(CERT_RELATIVE_DIR, `${bondId}.pdf`).replace(/\\/g, '/');
}

function aadhaarLast4(encrypted: string): string {
  try {
    const digits = decryptAadhaar(encrypted).replace(/\D/g, '');
    return digits.length >= 4 ? digits.slice(-4) : digits.padStart(4, '0');
  } catch {
    return 'XXXX';
  }
}

function commissionerDisplayName(role: UserRole): string {
  return role === 'COMMISSIONER' ? 'Commissioner APCRDA' : 'Additional Commissioner APCRDA';
}

async function ensureCertificateDir(): Promise<void> {
  await fs.mkdir(path.join(process.cwd(), CERT_RELATIVE_DIR), { recursive: true });
}

function assertBondReadyForCertificate(bond: TdrBondWithRelations): void {
  if (!bond.holder) throw new ValidationError('Holder details required before certificate mint');
  if (!bond.landDetails) throw new ValidationError('Land details required before certificate mint');
}

/** Generate PDF, persist locally, and return mint metadata (no DB write). */
export async function prepareBondCertificate(params: {
  bond: TdrBondWithRelations;
  actorRole: UserRole;
  employeeId?: string;
  verifyOrigin: string;
  approvalFabricTxId?: string | null;
}): Promise<MintedCertificate> {
  assertBondReadyForCertificate(params.bond);

  const verifyUrl = `${params.verifyOrigin}/verify/${params.bond.tdrNumber}`;
  const qrBuffer = await QRCode.toBuffer(verifyUrl);

  const pdfBuffer = await generateCertificatePdf(
    {
      tdrNumber: params.bond.tdrNumber,
      tdrCertificateNumber:
        params.bond.landDetails!.tdrCertificateNumber ??
        `CERT-${params.bond.tdrNumber.replace(/[^0-9]/g, '')}`,
      holderName: params.bond.holder!.name,
      aadhaarLast4: aadhaarLast4(params.bond.holder!.aadhaarEncrypted),
      relationType: params.bond.holder!.relationType.replace('_', '/'),
      relationName: params.bond.holder!.relationName,
      surveyNumber: params.bond.landDetails!.surveyNumber,
      village: params.bond.landDetails!.surrenderedVillage,
      mandal: params.bond.holder!.mandal,
      district: params.bond.holder!.district,
      ownershipDeedNo: params.bond.landDetails!.ownershipDeedNo,
      surrenderedAreaSqYds: Number(params.bond.landDetails!.surrenderedAreaSqYds),
      tdrExtentSqYds: Number(params.bond.landDetails!.tdrIssuedExtentSqYds),
      issuedRatio: params.bond.landDetails!.issuedRatio,
      issuedAt: (params.bond.mintedAt ?? params.bond.updatedAt).toISOString(),
      commissionerName: commissionerDisplayName(params.actorRole),
      fabricTxId: params.approvalFabricTxId ?? undefined,
      blockchainPending: isFabricMockMode(),
    },
    qrBuffer,
  );

  await ensureCertificateDir();
  const absolutePath = certificateAbsolutePath(params.bond.id);
  await fs.writeFile(absolutePath, pdfBuffer);

  const certificateIpfsCid = `bafy-cert-${params.bond.tdrNumber.replace(/[^a-z0-9]/gi, '').toLowerCase()}`;
  const commissionerHash = params.employeeId
    ? generateApprovalSignature(params.employeeId, params.bond.id, 'CERT', Date.now())
    : 'unsigned-dev';

  const fabricTxId = await fabric.mintCertificate(
    params.bond.tdrNumber,
    certificateIpfsCid,
    commissionerHash,
  );

  return {
    certificateIpfsCid,
    certificateStoragePath: certificateRelativePath(params.bond.id),
    fabricTxId,
    pdfSize: pdfBuffer.length,
  };
}

/** Load certificate PDF bytes for download. */
export async function readBondCertificatePdf(
  bondId: string,
  storagePath?: string | null,
): Promise<Buffer> {
  const absolutePath = storagePath
    ? path.join(process.cwd(), storagePath.replace(/^\//, ''))
    : certificateAbsolutePath(bondId);

  try {
    return await fs.readFile(absolutePath);
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

  // AUDIT: Records TDR certificate PDF generation after final commissioner approval
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
