import type { TdrBondWithRelations } from '@/types';
import type { UserRole } from '@/types';
import type { CertificateData } from '@/types/certificate';
import { RELATION_LABELS } from '@/lib/bond-review-fields';
import { isFabricMockMode } from '@/lib/fabric/gateway';
import { decryptAadhaar } from '@/lib/security/hmac';

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

/** Single source of truth for certificate text used by UI preview and PDF generation. */
export function buildCertificateRenderData(
  bond: TdrBondWithRelations,
  options: {
    actorRole?: UserRole;
    approvalFabricTxId?: string | null;
  } = {},
): CertificateData | null {
  if (!bond.holder || !bond.landDetails) return null;

  const relationLabel =
    RELATION_LABELS[bond.holder.relationType] ?? bond.holder.relationType.replace('_', '/');

  return {
    tdrNumber: bond.tdrNumber,
    tdrCertificateNumber:
      bond.landDetails.tdrCertificateNumber ?? `CERT-${bond.tdrNumber.replace(/[^0-9]/g, '')}`,
    holderName: bond.holder.name,
    aadhaarLast4: aadhaarLast4(bond.holder.aadhaarEncrypted),
    relationType: relationLabel,
    relationName: bond.holder.relationName,
    surveyNumber: bond.landDetails.surveyNumber,
    village: bond.landDetails.surrenderedVillage,
    mandal: bond.holder.mandal,
    district: bond.holder.district,
    ownershipDeedNo: bond.landDetails.ownershipDeedNo,
    surrenderedAreaSqYds: Number(bond.landDetails.surrenderedAreaSqYds),
    tdrExtentSqYds: Number(bond.landDetails.tdrIssuedExtentSqYds),
    issuedRatio: bond.landDetails.issuedRatio,
    issuedAt: (bond.mintedAt ?? bond.updatedAt).toISOString(),
    commissionerName: commissionerDisplayName(options.actorRole ?? 'COMMISSIONER'),
    fabricTxId: options.approvalFabricTxId ?? bond.fabricTxId ?? undefined,
    blockchainPending: isFabricMockMode(),
  };
}
