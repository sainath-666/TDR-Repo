import { BondStatus } from '@prisma/client';
import type { UserRole } from '@/types';

/** Government approval level (L1–L5) per APCRDA workflow */
export function getGovApprovalLevel(role: UserRole): number | null {
  switch (role) {
    case 'DEO':
    case 'SURVEYOR':
      return 1;
    case 'DY_TAHSILDAR':
    case 'TAHSILDAR':
      return 2;
    case 'SDC':
      return 3;
    case 'DIRECTOR_LANDS':
      return 4;
    case 'COMMISSIONER':
    case 'ADDL_COMMISSIONER':
      return 5;
    default:
      return null;
  }
}

export const GOV_LEVEL_LABELS: Record<number, string> = {
  1: 'L1 — DEO / Surveyor',
  2: 'L2 — Dy. Tahsildar',
  3: 'L3 — Sub-Divisional Collector',
  4: 'L4 — Director (Lands)',
  5: 'L5 — Commissioner',
};

/** Bond status waiting at each approval level (L2–L5) */
export const LEVEL_QUEUE_STATUS: Partial<Record<number, BondStatus>> = {
  2: BondStatus.PENDING_L1,
  3: BondStatus.PENDING_L2,
  4: BondStatus.PENDING_L3,
  5: BondStatus.PENDING_L4,
};

/** Statuses that have cleared a given approval level */
export const LEVEL_FORWARD_STATUSES: Partial<Record<number, BondStatus[]>> = {
  2: [BondStatus.PENDING_L2, BondStatus.PENDING_L3, BondStatus.PENDING_L4, BondStatus.ACTIVE],
  3: [BondStatus.PENDING_L3, BondStatus.PENDING_L4, BondStatus.ACTIVE],
  4: [BondStatus.PENDING_L4, BondStatus.ACTIVE],
  5: [BondStatus.ACTIVE],
};

export function getOfficialDashboardPath(role: UserRole): string {
  if (role === 'DEO' || role === 'SURVEYOR') return '/deo/dashboard';
  if (role === 'FARMER') return '/farmer/dashboard';
  return '/official/dashboard';
}
