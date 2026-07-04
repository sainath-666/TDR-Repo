/** Demo credentials for seeded officials and farmers (shown on login screens). */
export const DEV_EMAIL_DOMAIN = 'apcrda.org';
export const DEV_LOGIN_PASSWORD_HINT = 'Test@123';

/** Seeded citizen (Padmavathi / TDR-2025-004) — any 6-digit OTP accepted in demo mode. */
export const DEMO_FARMER_PHONE = '9666666666';
export const DEMO_FARMER_OTP_HINT = '123456';
export const DEMO_FARMER_LABEL = 'Smt. Padmavathi · TDR-2025-004';

export function getDevPassword(): string {
  return process.env.AUTH_DEV_PASSWORD ?? DEV_LOGIN_PASSWORD_HINT;
}

export function officialDevEmail(employeeId: string): string {
  return `${employeeId.toLowerCase()}@${DEV_EMAIL_DOMAIN}`;
}

export function farmerDevEmail(phone: string): string {
  return `farmer-${phone}@${DEV_EMAIL_DOMAIN}`;
}

/** Demo citizen login is always visible (same as official approval logins). */
export function isFarmerDemoLoginVisible(): boolean {
  return true;
}
