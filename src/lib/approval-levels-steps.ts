import { BondStatus, OfficialRole } from '@prisma/client';
import { APPROVAL_CHAIN } from '@/lib/approval-chain';

export const APPROVAL_LEVELS = APPROVAL_CHAIN.slice(1).map((stage, index) => ({
  level: index + 1,
  role: stage.officialRole,
  status: stage.queueStatus,
}));

/** Post-intake approval step roles (Tahsildar → Commissioner) */
export const POST_INTAKE_APPROVAL_ROLES: OfficialRole[] = [
  OfficialRole.DY_TAHSILDAR,
  OfficialRole.SDC,
  OfficialRole.DIRECTOR_LANDS,
  OfficialRole.COMMISSIONER,
];

export function getPostIntakeStatusForLevel(level: number): BondStatus {
  const stage = APPROVAL_CHAIN[level]; // level 2 → index 1 → PENDING_L1
  return stage?.queueStatus ?? BondStatus.PENDING_L1;
}
