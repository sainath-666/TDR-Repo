import { APPROVAL_CHAIN } from '@/lib/approval-chain';

/** Dev login hint shown on the official login page */
export const DEV_LOGIN_PASSWORD_HINT = 'DevPassword123!';

export function getApprovalLoginAccounts() {
  return APPROVAL_CHAIN.map((stage) => ({
    employeeId: stage.employeeId,
    email: `${stage.employeeId.toLowerCase()}@dev.apcrda.local`,
    label: stage.label,
    shortLabel: stage.shortLabel,
    level: stage.level,
    dashboardPath: stage.dashboardPath,
  }));
}

export function isApprovalDevLoginsVisible(): boolean {
  return process.env.NODE_ENV !== 'production' || process.env.NEXT_PUBLIC_AUTH_DEV_MODE === 'true';
}
