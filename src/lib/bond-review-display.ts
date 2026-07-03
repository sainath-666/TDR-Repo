import type { TdrBondWithRelations } from '@/types';
import { decryptAadhaar } from '@/lib/security/hmac';
import { RELATION_LABELS } from '@/lib/bond-review-fields';

export interface BondReviewDisplay {
  holder: {
    name: string;
    relation: string;
    aadhaar: string;
    mobile: string;
    email: string;
    doorNo: string;
    street: string;
    village: string;
    mandal: string;
    district: string;
  };
  land: {
    village: string;
    surveyNumber: string;
    ownershipDeedNo: string;
    surrenderedAreaSqYds: string;
    tdrIssuedExtentSqYds: string;
    issuedRatio: string;
    tdrCertificateNumber: string;
  } | null;
}

function formatAadhaarForReview(encrypted: string | undefined): string {
  if (!encrypted || encrypted === 'ENCRYPTED_PLACEHOLDER') return '—';
  try {
    const digits = decryptAadhaar(encrypted).replace(/\D/g, '');
    if (digits.length !== 12) return digits || '—';
    return `${digits.slice(0, 4)} ${digits.slice(4, 8)} ${digits.slice(8)}`;
  } catch {
    return '—';
  }
}

function formatSqYds(value: { toString(): string } | number | null | undefined): string {
  if (value == null) return '—';
  const n = Number(value);
  if (Number.isNaN(n)) return '—';
  return `${n.toLocaleString('en-IN')} Sq Yards`;
}

export function buildBondReviewDisplay(bond: TdrBondWithRelations): BondReviewDisplay {
  const holder = bond.holder;

  const relation =
    holder != null ? `${RELATION_LABELS[holder.relationType]} ${holder.relationName}` : '—';

  return {
    holder: {
      name: holder?.name ?? '—',
      relation,
      aadhaar: holder ? formatAadhaarForReview(holder.aadhaarEncrypted) : '—',
      mobile: holder?.aadhaarPhone?.trim() ? holder.aadhaarPhone : '—',
      email: holder?.email ?? '—',
      doorNo: holder?.doorNo ?? '—',
      street: holder?.street ?? '—',
      village: holder?.village ?? '—',
      mandal: holder?.mandal ?? '—',
      district: holder?.district ?? '—',
    },
    land: bond.landDetails
      ? {
          village: bond.landDetails.surrenderedVillage,
          surveyNumber: bond.landDetails.surveyNumber,
          ownershipDeedNo: bond.landDetails.ownershipDeedNo ?? '',
          surrenderedAreaSqYds: formatSqYds(bond.landDetails.surrenderedAreaSqYds),
          tdrIssuedExtentSqYds: formatSqYds(bond.landDetails.tdrIssuedExtentSqYds),
          issuedRatio: bond.landDetails.issuedRatio,
          tdrCertificateNumber: bond.landDetails.tdrCertificateNumber ?? '',
        }
      : null,
  };
}
