import {
  BondStatus,
  ApprovalDecision,
  OfficialRole,
  DocumentType,
  RelationType,
  Prisma,
} from '@prisma/client';

export { BondStatus, ApprovalDecision, OfficialRole, DocumentType, RelationType };

export type UserRole = OfficialRole | 'FARMER';

export interface CurrentUser {
  id: string;
  role: UserRole;
  districtCode?: string;
  employeeId?: string;
  farmerId?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CerbosResource {
  kind: string;
  id: string;
  attributes?: Record<string, unknown>;
}

export interface BondPhase1 {
  tdrNumber: string;
  name: string;
  relationType: RelationType;
  relationName: string;
  aadhaarNumber: string;
  aadhaarPhone: string;
  email?: string;
  doorNo: string;
  street: string;
  village: string;
  mandal: string;
  district: string;
}

export interface BondPhase2 {
  surrenderedVillage: string;
  surveyNumber: string;
  ownershipDeedNo?: string;
  surrenderedAreaSqYds: number;
  tdrIssuedExtentSqYds: number;
  issuedRatio: string;
  tdrCertificateNumber?: string;
  returnablePlotCode?: string;
}

export type TdrBondWithRelations = Prisma.TdrBondGetPayload<{
  include: {
    holder: true;
    landDetails: true;
    documents: true;
    approvalSteps: true;
    farmer: true;
    creator: true;
  };
}>;

export const BOND_STATUS_TRANSITIONS: Record<
  string,
  { event: string; to: BondStatus; roles: UserRole[] }[]
> = {
  DRAFT: [{ event: 'submit', to: BondStatus.PENDING_L1, roles: ['DEO', 'SURVEYOR'] }],
  PENDING_L1: [
    { event: 'approve', to: BondStatus.PENDING_L2, roles: ['DY_TAHSILDAR', 'TAHSILDAR'] },
    { event: 'reject', to: BondStatus.REJECTED, roles: ['DY_TAHSILDAR', 'TAHSILDAR'] },
    { event: 'return', to: BondStatus.DRAFT, roles: ['DY_TAHSILDAR', 'TAHSILDAR'] },
  ],
  PENDING_L2: [
    { event: 'approve', to: BondStatus.PENDING_L3, roles: ['SDC'] },
    { event: 'reject', to: BondStatus.REJECTED, roles: ['SDC'] },
    { event: 'return', to: BondStatus.DRAFT, roles: ['SDC'] },
  ],
  PENDING_L3: [
    { event: 'approve', to: BondStatus.PENDING_L4, roles: ['DIRECTOR_LANDS'] },
    { event: 'reject', to: BondStatus.REJECTED, roles: ['DIRECTOR_LANDS'] },
    { event: 'return', to: BondStatus.DRAFT, roles: ['DIRECTOR_LANDS'] },
  ],
  PENDING_L4: [
    { event: 'approve', to: BondStatus.ACTIVE, roles: ['COMMISSIONER', 'ADDL_COMMISSIONER'] },
    { event: 'reject', to: BondStatus.REJECTED, roles: ['COMMISSIONER', 'ADDL_COMMISSIONER'] },
  ],
  ACTIVE: [{ event: 'revoke', to: BondStatus.REVOKED, roles: ['COMMISSIONER'] }],
};

export const STATUS_TO_LEVEL: Partial<Record<BondStatus, number>> = {
  PENDING_L1: 1,
  PENDING_L2: 2,
  PENDING_L3: 3,
  PENDING_L4: 4,
};

export const LEVEL_TO_ROLE: Record<number, OfficialRole> = {
  1: OfficialRole.DY_TAHSILDAR,
  2: OfficialRole.SDC,
  3: OfficialRole.DIRECTOR_LANDS,
  4: OfficialRole.COMMISSIONER,
};

export const OFFICIAL_ROLES: UserRole[] = [
  'DEO',
  'SURVEYOR',
  'DY_TAHSILDAR',
  'TAHSILDAR',
  'SDC',
  'DIRECTOR_LANDS',
  'ADDL_COMMISSIONER',
  'COMMISSIONER',
];

export function isOfficialRole(role: UserRole): boolean {
  return OFFICIAL_ROLES.includes(role);
}

export function getQueueStatusForRole(role: UserRole): BondStatus | null {
  switch (role) {
    case 'DY_TAHSILDAR':
    case 'TAHSILDAR':
      return BondStatus.PENDING_L1;
    case 'SDC':
      return BondStatus.PENDING_L2;
    case 'DIRECTOR_LANDS':
      return BondStatus.PENDING_L3;
    case 'COMMISSIONER':
    case 'ADDL_COMMISSIONER':
      return BondStatus.PENDING_L4;
    default:
      return null;
  }
}
