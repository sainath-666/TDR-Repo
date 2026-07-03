import { BondStatus, ApprovalDecision, OfficialRole } from '@prisma/client';
import { BOND_STATUS_TRANSITIONS, STATUS_TO_LEVEL, LEVEL_TO_ROLE } from '@/types';
import type { UserRole } from '@/types';
import { ValidationError } from '@/lib/errors';
import { APPROVAL_CHAIN } from '@/lib/approval-chain';

export function getExpectedLevel(status: BondStatus): number | null {
  return STATUS_TO_LEVEL[status] ?? null;
}

export function getNextStatus(status: BondStatus, event: string): BondStatus {
  const transitions = BOND_STATUS_TRANSITIONS[status];
  if (!transitions) throw new ValidationError(`Invalid status: ${status}`);
  const transition = transitions.find((t) => t.event === event);
  if (!transition) throw new ValidationError(`Invalid transition: ${status} → ${event}`);
  return transition.to;
}

export function validateTransition(status: BondStatus, event: string, role: UserRole): BondStatus {
  const transitions = BOND_STATUS_TRANSITIONS[status];
  if (!transitions) throw new ValidationError(`Bond is in terminal or invalid status: ${status}`);
  const transition = transitions.find((t) => t.event === event);
  if (!transition) throw new ValidationError(`Cannot ${event} bond in status ${status}`);
  if (!transition.roles.includes(role)) {
    throw new ValidationError(`Role ${role} cannot ${event} bond in status ${status}`);
  }
  return transition.to;
}

export function getApprovalRoleForLevel(level: number): OfficialRole {
  return LEVEL_TO_ROLE[level] ?? OfficialRole.DY_TAHSILDAR;
}

export function mapDecisionToEvent(decision: ApprovalDecision): string {
  switch (decision) {
    case ApprovalDecision.APPROVED:
      return 'approve';
    case ApprovalDecision.REJECTED:
      return 'reject';
    case ApprovalDecision.RETURNED:
      return 'return';
    default:
      throw new ValidationError('Invalid approval decision');
  }
}

export const APPROVAL_LEVELS = APPROVAL_CHAIN.slice(1).map((stage, index) => ({
  level: index + 1,
  role: stage.officialRole,
  status: stage.queueStatus,
}));
