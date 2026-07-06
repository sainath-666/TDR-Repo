/**
 * Syncs seeded officials from Prisma into Supabase Auth.
 * Citizens (farmers) use cookie sessions — they are not provisioned in Supabase.
 * Run after: npm run db:seed
 *
 * Usage: npm run auth:sync
 */
import { PrismaClient } from '@prisma/client';
import { getDevPassword, officialDevEmail } from '../src/lib/dev-auth';
import { ensureOfficialAuthUser } from '../src/lib/supabase/auth-users';

const prisma = new PrismaClient();

async function main() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('ERROR: Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env');
    process.exit(1);
  }

  const officials = await prisma.official.findMany({ where: { isActive: true } });

  console.log(`Syncing ${officials.length} officials to Supabase Auth...`);

  for (const official of officials) {
    await ensureOfficialAuthUser(official);
    console.log(`  ✓ Official ${official.employeeId} (${official.role})`);
  }

  console.log('\nOfficial login emails (after auth:sync):');
  for (const o of officials) {
    console.log(`  ${o.employeeId} → ${officialDevEmail(o.employeeId)}`);
  }
  console.log(`  Password (dev): ${getDevPassword()}`);
  console.log('\nCitizen login: phone + OTP at /farmer-login (no Supabase account).');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
