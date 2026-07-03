import { BondStatus, OfficialRole } from '@prisma/client';
import type { UserRole } from '@/types';

/** The five APCRDA approval logins (top → bottom in the workflow). */
export const APPROVAL_CHAIN = [
  {
    level: 1,
    label: 'Data Entry Operator / Surveyor',
    shortLabel: 'DEO',
    roles: ['DEO', 'SURVEYOR'] as const satisfies readonly UserRole[],
    officialRole: OfficialRole.DEO,
    queueStatus: BondStatus.DRAFT,
    dashboardPath: '/deo/dashboard',
    employeeId: 'DEO001',
  },
  {
    level: 2,
    label: 'Deputy Tahsildar / Tahsildar',
    shortLabel: 'Tahsildar',
    roles: ['DY_TAHSILDAR', 'TAHSILDAR'] as const satisfies readonly UserRole[],
    officialRole: OfficialRole.DY_TAHSILDAR,
    queueStatus: BondStatus.PENDING_L1,
    dashboardPath: '/official/dashboard',
    employeeId: 'TAH001',
  },
  {
    level: 3,
    label: 'SDC',
    shortLabel: 'SDC',
    roles: ['SDC'] as const satisfies readonly UserRole[],
    officialRole: OfficialRole.SDC,
    queueStatus: BondStatus.PENDING_L2,
    dashboardPath: '/official/dashboard',
    employeeId: 'SDC001',
  },
  {
    level: 4,
    label: 'Director (Lands)',
    shortLabel: 'Director',
    roles: ['DIRECTOR_LANDS'] as const satisfies readonly UserRole[],
    officialRole: OfficialRole.DIRECTOR_LANDS,
    queueStatus: BondStatus.PENDING_L3,
    dashboardPath: '/official/dashboard',
    employeeId: 'DIR001',
  },
  {
    level: 5,
    label: 'Additional Commissioner / Commissioner',
    shortLabel: 'Commissioner',
    roles: ['COMMISSIONER', 'ADDL_COMMISSIONER'] as const satisfies readonly UserRole[],
    officialRole: OfficialRole.COMMISSIONER,
    queueStatus: BondStatus.PENDING_L4,
    dashboardPath: '/official/dashboard',
    employeeId: 'COM001',
  },
] as const;

export type ApprovalChainLevel = (typeof APPROVAL_CHAIN)[number]['level'];

export function getApprovalStageForRole(role: UserRole) {
  return APPROVAL_CHAIN.find((stage) => (stage.roles as readonly UserRole[]).includes(role));
}

export function getGovApprovalLevel(role: UserRole): number | null {
  return getApprovalStageForRole(role)?.level ?? null;
}

export function getOfficialDashboardPath(role: UserRole): string {
  if (role === 'FARMER') return '/farmer/dashboard';
  return getApprovalStageForRole(role)?.dashboardPath ?? '/official/dashboard';
}

export function getQueueStatusForRole(role: UserRole): BondStatus | null {
  return getApprovalStageForRole(role)?.queueStatus ?? null;
}

export const GOV_LEVEL_LABELS: Record<number, string> = Object.fromEntries(
  APPROVAL_CHAIN.map((s) => [s.level, s.label]),
);

export const GOV_LEVEL_SHORT_LABELS: Record<number, string> = Object.fromEntries(
  APPROVAL_CHAIN.map((s) => [s.level, s.shortLabel]),
);

/** Bond statuses forwarded after each approval stage clears */
export const LEVEL_FORWARD_STATUSES: Partial<Record<number, BondStatus[]>> = {
  2: [BondStatus.PENDING_L2, BondStatus.PENDING_L3, BondStatus.PENDING_L4, BondStatus.ACTIVE],
  3: [BondStatus.PENDING_L3, BondStatus.PENDING_L4, BondStatus.ACTIVE],
  4: [BondStatus.PENDING_L4, BondStatus.ACTIVE],
  5: [BondStatus.ACTIVE],
};

/** @deprecated Use getQueueStatusForRole — kept for dashboard level-2+ queue stats */
export const LEVEL_QUEUE_STATUS: Partial<Record<number, BondStatus>> = {
  2: BondStatus.PENDING_L1,
  3: BondStatus.PENDING_L2,
  4: BondStatus.PENDING_L3,
  5: BondStatus.PENDING_L4,
};
