export interface CertificateData {
  tdrNumber: string;
  tdrCertificateNumber: string;
  holderName: string;
  aadhaarLast4: string;
  relationType: string;
  relationName: string;
  surveyNumber: string;
  village: string;
  mandal: string;
  district: string;
  ownershipDeedNo?: string | null;
  surrenderedAreaSqYds: number;
  tdrExtentSqYds: number;
  issuedRatio: string;
  issuedAt: string;
  commissionerName: string;
  fabricTxId?: string;
  /** When true, ledger anchoring is deferred (Fabric not yet deployed). */
  blockchainPending?: boolean;
}
