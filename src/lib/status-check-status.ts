import { TdrStatusCheckRequestStatus } from '@prisma/client';

export const STATUS_CHECK_LABELS: Record<TdrStatusCheckRequestStatus, string> = {
  PENDING: 'Pending',
  IN_REVIEW: 'In Review',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
};

export const STATUS_CHECK_BADGE_CLASSES: Record<TdrStatusCheckRequestStatus, string> = {
  PENDING: 'bg-amber-50 text-amber-800 ring-amber-200',
  IN_REVIEW: 'bg-blue-50 text-blue-800 ring-blue-200',
  RESOLVED: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  CLOSED: 'bg-slate-100 text-slate-600 ring-slate-200',
};

export function formatStatusCheckStatus(status: TdrStatusCheckRequestStatus): string {
  return STATUS_CHECK_LABELS[status] ?? status;
}
