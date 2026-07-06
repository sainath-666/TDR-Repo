/**
 * Removes farmer auth users from Supabase Auth.
 * Citizens authenticate via signed cookie — farmers no longer use Supabase.
 *
 * Usage: npm run auth:cleanup-farmers
 */
import { PrismaClient } from '@prisma/client';
import { createAdminClient } from '../src/lib/supabase/admin';

const prisma = new PrismaClient();

async function deleteFarmerAuthUsers(): Promise<void> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('ERROR: Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env');
    process.exit(1);
  }

  const admin = createAdminClient();
  const farmers = await prisma.farmer.findMany({
    select: { id: true, name: true, aadhaarPhone: true },
  });

  const deletedIds = new Set<string>();

  console.log(`Checking ${farmers.length} Prisma farmers in Supabase Auth...`);

  for (const farmer of farmers) {
    const { data } = await admin.auth.admin.getUserById(farmer.id);
    if (!data.user) continue;

    const { error } = await admin.auth.admin.deleteUser(farmer.id);
    if (error) {
      console.error(`  ✗ Failed to delete ${farmer.name} (${farmer.id}): ${error.message}`);
      continue;
    }

    deletedIds.add(farmer.id);
    console.log(`  ✓ Deleted ${farmer.name} (+91${farmer.aadhaarPhone})`);
  }

  let page = 1;
  const perPage = 100;

  console.log('\nScanning for remaining Supabase users with role=FARMER...');

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw new Error(`Failed to list users: ${error.message}`);

    for (const user of data.users) {
      const role = (user.app_metadata as { role?: string } | undefined)?.role;
      if (role !== 'FARMER' || deletedIds.has(user.id)) continue;

      const { error: delError } = await admin.auth.admin.deleteUser(user.id);
      if (delError) {
        console.error(`  ✗ Failed to delete orphan ${user.id}: ${delError.message}`);
        continue;
      }

      deletedIds.add(user.id);
      console.log(`  ✓ Deleted orphan farmer user ${user.id}`);
    }

    if (data.users.length < perPage) break;
    page++;
  }

  console.log(`\nDone. Removed ${deletedIds.size} farmer auth user(s) from Supabase.`);
}

deleteFarmerAuthUsers()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
