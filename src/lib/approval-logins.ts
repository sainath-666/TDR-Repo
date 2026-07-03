import { APPROVAL_CHAIN } from '@/lib/approval-chain';
import { DEV_LOGIN_PASSWORD_HINT, officialDevEmail } from '@/lib/dev-auth';

export { DEV_LOGIN_PASSWORD_HINT };

export function getApprovalLoginAccounts() {
  return APPROVAL_CHAIN.map((stage) => ({
    employeeId: stage.employeeId,
    email: officialDevEmail(stage.employeeId),
    label: stage.label,
    shortLabel: stage.shortLabel,
    level: stage.level,
    dashboardPath: stage.dashboardPath,
  }));
}

export function isApprovalDevLoginsVisible(): boolean {
  return true;
}
