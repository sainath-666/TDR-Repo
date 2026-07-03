import type { DocumentType, RelationType } from '@prisma/client';
import { REQUIRED_DOCUMENT_TYPES } from '@/lib/validations/bond';

/** Category 1 — Address of the TDR holder (from external APCRDA API) */
export const HOLDER_REVIEW_FIELDS = [
  { key: 'name', label: 'Name' },
  { key: 'relation', label: 'S/o; D/o; W/o;' },
  { key: 'aadhaar', label: 'Aadhaar Number' },
  { key: 'mobile', label: 'Mobile No.' },
  { key: 'email', label: 'Email Id' },
  { key: 'doorNo', label: 'Door No. / Survey No.' },
  { key: 'street', label: 'Street / Locality' },
  { key: 'village', label: 'Village' },
  { key: 'mandal', label: 'Mandal' },
  { key: 'district', label: 'District' },
] as const;

/** Category 2 — Details of the Land Surrendered */
export const LAND_REVIEW_FIELDS = [
  { key: 'village', label: 'Village' },
  { key: 'surveyNumber', label: 'Survey Number / Division No. / Door No.' },
  { key: 'ownershipDeedNo', label: 'Ownership Deed No. / Patta' },
  { key: 'surrenderedAreaSqYds', label: 'Surrendered Site Area (opted for TDR)' },
  { key: 'tdrIssuedExtentSqYds', label: 'TDR Issued Extent' },
  { key: 'issuedRatio', label: 'Issued Ratio' },
  { key: 'tdrCertificateNumber', label: 'TDR Certificate Number' },
] as const;

export const RELATION_LABELS: Record<RelationType, string> = {
  S_O: 'S/o',
  D_O: 'D/o',
  W_O: 'W/o',
};

export interface DocumentReviewSpec {
  order: number;
  type: DocumentType;
  label: string;
}

/** Category 3 — Documents to upload (numbered as per APCRDA checklist) */
export const DOCUMENT_REVIEW_SPECS: DocumentReviewSpec[] = [
  {
    order: 1,
    type: 'OWNERSHIP_DOCUMENT',
    label: 'Ownership Document copy',
  },
  {
    order: 2,
    type: 'AADHAAR_COPY',
    label: 'Aadhaar copy with phone number display',
  },
  {
    order: 3,
    type: 'RETURNABLE_PLOT_ALLOTMENT',
    label: 'Returnable plot allotment copy & Registration document',
  },
  {
    order: 4,
    type: 'TDR_ISSUED_COPY',
    label: 'TDR issued Copy',
  },
  {
    order: 5,
    type: 'INDIVIDUAL_SKETCH',
    label: 'Individual sketch / Location of the surrendered land',
  },
];

export function isRequiredDocumentType(type: DocumentType): boolean {
  return (REQUIRED_DOCUMENT_TYPES as readonly DocumentType[]).includes(type);
}
