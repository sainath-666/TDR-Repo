import { BondStatus } from '@prisma/client';

export const BOND_STATUS_LABELS: Record<BondStatus, string> = {
  DRAFT: 'Awaiting DEO / Surveyor',
  PENDING_L1: 'Awaiting Dy. Tahsildar',
  PENDING_L2: 'Awaiting SDC',
  PENDING_L3: 'Awaiting Director (Lands)',
  PENDING_L4: 'Awaiting Commissioner',
  ACTIVE: 'Active',
  REJECTED: 'Rejected',
  REVOKED: 'Revoked',
};

export type StatusVariant =
  | 'slate'
  | 'amber'
  | 'orange'
  | 'blue'
  | 'purple'
  | 'green'
  | 'red'
  | 'gray';

export const BOND_STATUS_VARIANTS: Record<BondStatus, StatusVariant> = {
  DRAFT: 'slate',
  PENDING_L1: 'amber',
  PENDING_L2: 'orange',
  PENDING_L3: 'blue',
  PENDING_L4: 'purple',
  ACTIVE: 'green',
  REJECTED: 'red',
  REVOKED: 'gray',
};

export const STATUS_VARIANT_CLASSES: Record<StatusVariant, string> = {
  slate: 'bg-slate-100 text-slate-700 ring-slate-200',
  amber: 'bg-amber-50 text-amber-800 ring-amber-200',
  orange: 'bg-orange-50 text-orange-800 ring-orange-200',
  blue: 'bg-blue-50 text-blue-800 ring-blue-200',
  purple: 'bg-purple-50 text-purple-800 ring-purple-200',
  green: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  red: 'bg-red-50 text-red-800 ring-red-200',
  gray: 'bg-gray-100 text-gray-600 ring-gray-200',
};

export const BOND_STATUS_BADGE_CLASSES: Record<BondStatus, string> = {
  DRAFT: STATUS_VARIANT_CLASSES.slate,
  PENDING_L1: STATUS_VARIANT_CLASSES.amber,
  PENDING_L2: STATUS_VARIANT_CLASSES.orange,
  PENDING_L3: STATUS_VARIANT_CLASSES.blue,
  PENDING_L4: STATUS_VARIANT_CLASSES.purple,
  ACTIVE: STATUS_VARIANT_CLASSES.green,
  REJECTED: STATUS_VARIANT_CLASSES.red,
  REVOKED: STATUS_VARIANT_CLASSES.gray,
};

export function resolveBondStatus(status: BondStatus | string | undefined): BondStatus | undefined {
  if (!status) return undefined;
  if (status in BOND_STATUS_LABELS) return status as BondStatus;
  return undefined;
}
export const BOND_STATUS_CHART_COLORS: Record<BondStatus, string> = {
  DRAFT: '#475569',
  PENDING_L1: '#d97706',
  PENDING_L2: '#ea580c',
  PENDING_L3: '#2563eb',
  PENDING_L4: '#7c3aed',
  ACTIVE: '#059669',
  REJECTED: '#dc2626',
  REVOKED: '#9ca3af',
};

/** Workflow order for chart axes and legends. */
export const BOND_STATUS_ORDER: BondStatus[] = [
  BondStatus.DRAFT,
  BondStatus.PENDING_L1,
  BondStatus.PENDING_L2,
  BondStatus.PENDING_L3,
  BondStatus.PENDING_L4,
  BondStatus.ACTIVE,
  BondStatus.REJECTED,
  BondStatus.REVOKED,
];

const LEVEL_TO_STATUS: Record<number, BondStatus> = {
  1: BondStatus.DRAFT,
  2: BondStatus.PENDING_L1,
  3: BondStatus.PENDING_L2,
  4: BondStatus.PENDING_L3,
  5: BondStatus.PENDING_L4,
};

export function getApprovalLevelChartColor(level: number): string {
  const status = LEVEL_TO_STATUS[level];
  return status ? BOND_STATUS_CHART_COLORS[status] : '#94a3b8';
}

/** Lighter companion for “forwarded / pipeline” bars at the same stage. */
export function getApprovalLevelChartColorMuted(level: number): string {
  const muted: Record<number, string> = {
    1: '#94a3b8',
    2: '#fbbf24',
    3: '#fb923c',
    4: '#60a5fa',
    5: '#a78bfa',
  };
  return muted[level] ?? '#cbd5e1';
}

export function formatBondStatus(status: BondStatus): string {
  return BOND_STATUS_LABELS[status] ?? status;
}

export function isPendingStatus(status: BondStatus): boolean {
  return status.startsWith('PENDING');
}
