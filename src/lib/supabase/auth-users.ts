import { getDevPassword, officialDevEmail } from '@/lib/dev-auth';
import { createAdminClient } from './admin';

const DEV_PASSWORD = getDevPassword();

export { DEV_PASSWORD };

interface OfficialRecord {
  id: string;
  employeeId: string;
  name: string;
  role: string;
  districtCode: string;
}

export { officialDevEmail } from '@/lib/dev-auth';

export async function ensureOfficialAuthUser(official: OfficialRecord): Promise<void> {
  const admin = createAdminClient();
  const email = officialDevEmail(official.employeeId);
  const appMetadata = {
    role: official.role,
    district_code: official.districtCode,
    employee_id: official.employeeId,
  };

  const { data: existing } = await admin.auth.admin.getUserById(official.id);

  if (!existing.user) {
    const { error } = await admin.auth.admin.createUser({
      id: official.id,
      email,
      password: DEV_PASSWORD,
      email_confirm: true,
      user_metadata: { name: official.name },
      app_metadata: appMetadata,
    });
    if (error) throw new Error(`Failed to create official auth user: ${error.message}`);
    return;
  }

  const meta = existing.user.app_metadata as Record<string, unknown>;
  const alreadyReady =
    meta.role === official.role &&
    meta.employee_id === official.employeeId &&
    existing.user.email === email;
  if (alreadyReady) return;

  const { error } = await admin.auth.admin.updateUserById(official.id, {
    email,
    app_metadata: appMetadata,
    user_metadata: { name: official.name },
    password: DEV_PASSWORD,
  });
  if (error) throw new Error(`Failed to update official auth user: ${error.message}`);
}
