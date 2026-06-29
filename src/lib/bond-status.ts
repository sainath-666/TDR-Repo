import { BondStatus } from '@prisma/client';

export const BOND_STATUS_LABELS: Record<BondStatus, string> = {
  DRAFT: 'Draft',
  PENDING_L1: 'L1 Review',
  PENDING_L2: 'SDC Review',
  PENDING_L3: 'Director Review',
  PENDING_L4: 'Commissioner Review',
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

export function formatBondStatus(status: BondStatus): string {
  return BOND_STATUS_LABELS[status] ?? status;
}

export function isPendingStatus(status: BondStatus): boolean {
  return status.startsWith('PENDING');
}
