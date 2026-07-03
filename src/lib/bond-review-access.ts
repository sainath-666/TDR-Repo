import { BondStatus } from '@prisma/client';
import { getQueueStatusForRole } from '@/lib/approval-levels';
import type { UserRole } from '@/types';

/** Whether this role may approve/reject/return the bond in its current status. */
export function canActOnBondReview(role: UserRole, bondStatus: BondStatus): boolean {
  if (role === 'DEO' || role === 'SURVEYOR') {
    return bondStatus === BondStatus.DRAFT;
  }
  const queueStatus = getQueueStatusForRole(role);
  return queueStatus !== null && bondStatus === queueStatus;
}
