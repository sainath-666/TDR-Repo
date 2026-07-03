/**
 * Syncs seeded officials and farmers from Prisma into Supabase Auth.
 * Run after: npm run db:seed
 *
 * Usage: npm run auth:sync
 */
import { PrismaClient } from '@prisma/client';
import { ensureOfficialAuthUser, ensureFarmerAuthUser } from '../src/lib/supabase/auth-users';

const prisma = new PrismaClient();

async function main() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error(
      'ERROR: Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local or .env',
    );
    process.exit(1);
  }

  const officials = await prisma.official.findMany({ where: { isActive: true } });
  const farmers = await prisma.farmer.findMany();

  console.log(
    `Syncing ${officials.length} officials and ${farmers.length} farmers to Supabase Auth...`,
  );

  for (const official of officials) {
    await ensureOfficialAuthUser(official);
    console.log(`  ✓ Official ${official.employeeId} (${official.role})`);
  }

  for (const farmer of farmers) {
    await ensureFarmerAuthUser(farmer);
    console.log(`  ✓ Farmer ${farmer.name} (+91${farmer.aadhaarPhone})`);
  }

  console.log('\nOfficial login emails (after auth:sync):');
  for (const o of officials) {
    console.log(`  ${o.employeeId} → ${o.employeeId.toLowerCase()}@dev.apcrda.local`);
  }
  console.log(`  Password (dev): ${process.env.AUTH_DEV_PASSWORD ?? 'DevPassword123!'}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
