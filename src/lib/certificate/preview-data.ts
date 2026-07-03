import type { BondHolder, BondLandDetail } from '@prisma/client';
import { decryptAadhaar } from '@/lib/security/hmac';
import { RELATION_LABELS } from '@/lib/bond-review-fields';

export interface CertificatePreviewData {
  tdrNumber: string;
  holderName: string;
  relation: string;
  aadhaarDisplay: string;
  mobile: string;
  address: string;
  surveyNumber: string;
  village: string;
  mandal: string;
  district: string;
  ownershipDeedNo: string | null;
  returnablePlotCode: string | null;
  surrenderedAreaSqYds: number;
  tdrExtentSqYds: number;
  issuedRatio: string;
  tdrCertificateNumber: string;
  issuedAt: string | null;
  verifyPath: string;
}

function formatAadhaar(encrypted: string): string {
  try {
    const digits = decryptAadhaar(encrypted).replace(/\D/g, '');
    if (digits.length === 12) {
      return `${digits.slice(0, 4)} ${digits.slice(4, 8)} ${digits.slice(8)}`;
    }
    return digits || 'XXXX XXXX XXXX';
  } catch {
    return 'XXXX XXXX XXXX';
  }
}

export function buildCertificatePreviewData(bond: {
  tdrNumber: string;
  updatedAt: Date;
  mintedAt?: Date | null;
  holder: Pick<
    BondHolder,
    | 'name'
    | 'relationType'
    | 'relationName'
    | 'aadhaarEncrypted'
    | 'aadhaarPhone'
    | 'doorNo'
    | 'street'
    | 'village'
    | 'mandal'
    | 'district'
  > | null;
  landDetails: Pick<
    BondLandDetail,
    | 'surveyNumber'
    | 'surrenderedVillage'
    | 'surrenderedAreaSqYds'
    | 'tdrIssuedExtentSqYds'
    | 'issuedRatio'
    | 'tdrCertificateNumber'
    | 'ownershipDeedNo'
    | 'returnablePlotCode'
  > | null;
}): CertificatePreviewData | null {
  if (!bond.holder || !bond.landDetails) return null;

  const relationLabel = RELATION_LABELS[bond.holder.relationType] ?? bond.holder.relationType;
  const address = [
    bond.holder.doorNo,
    bond.holder.street,
    bond.holder.village,
    bond.holder.mandal,
    bond.holder.district,
  ]
    .filter(Boolean)
    .join(', ');

  return {
    tdrNumber: bond.tdrNumber,
    holderName: bond.holder.name,
    relation: `${relationLabel} ${bond.holder.relationName}`,
    aadhaarDisplay: formatAadhaar(bond.holder.aadhaarEncrypted),
    mobile: bond.holder.aadhaarPhone,
    address,
    surveyNumber: bond.landDetails.surveyNumber,
    village: bond.landDetails.surrenderedVillage,
    mandal: bond.holder.mandal,
    district: bond.holder.district,
    ownershipDeedNo: bond.landDetails.ownershipDeedNo,
    returnablePlotCode: bond.landDetails.returnablePlotCode,
    surrenderedAreaSqYds: Number(bond.landDetails.surrenderedAreaSqYds),
    tdrExtentSqYds: Number(bond.landDetails.tdrIssuedExtentSqYds),
    issuedRatio: bond.landDetails.issuedRatio,
    tdrCertificateNumber:
      bond.landDetails.tdrCertificateNumber ?? `CERT-${bond.tdrNumber.replace(/[^0-9]/g, '')}`,
    issuedAt: bond.mintedAt?.toISOString() ?? bond.updatedAt.toISOString(),
    verifyPath: `/verify/${bond.tdrNumber}`,
  };
}
