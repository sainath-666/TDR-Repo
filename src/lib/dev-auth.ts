/** Dev-only credentials for seeded officials and farmers (not used in production SSO). */
export const DEV_EMAIL_DOMAIN = 'apcrda.org';
export const DEV_LOGIN_PASSWORD_HINT = 'Test@123';

export function getDevPassword(): string {
  return process.env.AUTH_DEV_PASSWORD ?? DEV_LOGIN_PASSWORD_HINT;
}

export function officialDevEmail(employeeId: string): string {
  return `${employeeId.toLowerCase()}@${DEV_EMAIL_DOMAIN}`;
}

export function farmerDevEmail(phone: string): string {
  return `farmer-${phone}@${DEV_EMAIL_DOMAIN}`;
}
