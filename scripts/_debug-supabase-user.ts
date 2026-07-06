import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';

const prisma = new PrismaClient();
const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

async function main() {
  const official = await prisma.official.findFirst({ where: { employeeId: 'DEO001' } });
  if (!official) {
    console.log('No DEO in prisma');
    return;
  }
  console.log('Prisma official id:', official.id, 'role:', official.role);

  const { data, error } = await admin.auth.admin.getUserById(official.id);
  if (error) {
    console.log('Supabase getUserById error:', error.message);
    const { data: list } = await admin.auth.admin.listUsers();
    const byEmail = list.users.find((u) => u.email?.includes('deo001'));
    if (byEmail) {
      console.log('Found by email instead:', byEmail.id, byEmail.app_metadata);
    }
    return;
  }
  console.log('Supabase user id:', data.user?.id);
  console.log('app_metadata:', data.user?.app_metadata);
  console.log('user_metadata:', data.user?.user_metadata);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
