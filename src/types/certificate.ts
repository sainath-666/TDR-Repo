export interface CertificateData {
  tdrNumber: string;
  holderName: string;
  aadhaarLast4: string;
  relationType: string;
  relationName: string;
  surveyNumber: string;
  village: string;
  surrenderedAreaSqYds: number;
  tdrExtentSqYds: number;
  issuedRatio: string;
  commissionerName: string;
  fabricTxId?: string;
}
