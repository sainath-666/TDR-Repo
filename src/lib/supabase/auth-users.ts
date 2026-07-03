import { createAdminClient } from './server';

const DEV_PASSWORD = 'DevPassword123!';

export { DEV_PASSWORD };

interface OfficialRecord {
  id: string;
  employeeId: string;
  name: string;
  role: string;
  districtCode: string;
}

interface FarmerRecord {
  id: string;
  name: string;
  aadhaarPhone: string;
}

export function officialDevEmail(employeeId: string): string {
  return `${employeeId.toLowerCase()}@dev.apcrda.local`;
}

export function farmerDevEmail(phone: string): string {
  return `farmer-${phone}@dev.apcrda.local`;
}

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
  } else {
    const { error } = await admin.auth.admin.updateUserById(official.id, {
      email,
      app_metadata: appMetadata,
      user_metadata: { name: official.name },
      ...(process.env.NODE_ENV !== 'production' || process.env.AUTH_DEV_MODE === 'true'
        ? { password: DEV_PASSWORD }
        : {}),
    });
    if (error) throw new Error(`Failed to update official auth user: ${error.message}`);
  }
}

export async function ensureFarmerAuthUser(farmer: FarmerRecord): Promise<void> {
  const admin = createAdminClient();
  const phone = `+91${farmer.aadhaarPhone}`;
  const appMetadata = {
    role: 'FARMER',
    farmer_id: farmer.id,
  };
  const isDev = process.env.NODE_ENV !== 'production' || process.env.AUTH_DEV_MODE === 'true';
  const devEmail = farmerDevEmail(farmer.aadhaarPhone);

  const { data: existing } = await admin.auth.admin.getUserById(farmer.id);

  if (!existing.user) {
    const { error } = await admin.auth.admin.createUser({
      id: farmer.id,
      phone,
      phone_confirm: true,
      user_metadata: { name: farmer.name },
      app_metadata: appMetadata,
      ...(isDev ? { email: devEmail, password: DEV_PASSWORD, email_confirm: true } : {}),
    });
    if (error) throw new Error(`Failed to create farmer auth user: ${error.message}`);
  } else {
    const { error } = await admin.auth.admin.updateUserById(farmer.id, {
      phone,
      phone_confirm: true,
      app_metadata: appMetadata,
      user_metadata: { name: farmer.name },
      ...(isDev ? { email: devEmail, password: DEV_PASSWORD } : {}),
    });
    if (error) throw new Error(`Failed to update farmer auth user: ${error.message}`);
  }
}

export async function syncFarmerAppMetadata(userId: string, farmerId: string): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(userId, {
    app_metadata: {
      role: 'FARMER',
      farmer_id: farmerId,
    },
  });
  if (error) throw new Error(`Failed to sync farmer metadata: ${error.message}`);
}
