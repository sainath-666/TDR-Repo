import { ApprovalDecision, type ApprovalStep, type OfficialRole } from '@prisma/client';
import { formatRole } from '@/lib/role-labels';

export interface BondReturnRemark {
  remarks: string;
  returnedByName: string | null;
  returnedByRole: OfficialRole;
  returnedByRoleLabel: string;
  returnedAt: string;
}

interface StepWithOfficial extends ApprovalStep {
  official?: { name: string } | null;
}

/** Latest return remark from an approval step (bond sent back to DEO). */
export function getLatestReturnRemark(steps: StepWithOfficial[]): BondReturnRemark | null {
  const returned = steps
    .filter((s) => s.decision === ApprovalDecision.RETURNED && s.remarks?.trim())
    .sort(
      (a, b) =>
        (b.decidedAt?.getTime() ?? b.createdAt.getTime()) -
        (a.decidedAt?.getTime() ?? a.createdAt.getTime()),
    );

  const latest = returned[0];
  if (!latest?.remarks) return null;

  const decidedAt = latest.decidedAt ?? latest.createdAt;

  return {
    remarks: latest.remarks.trim(),
    returnedByName: latest.official?.name ?? null,
    returnedByRole: latest.role,
    returnedByRoleLabel: formatRole(latest.role),
    returnedAt: decidedAt.toISOString(),
  };
}
