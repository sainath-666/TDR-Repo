import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const grants = await prisma.$queryRaw<{ table_name: string; privilege_type: string }[]>`
    SELECT table_name, privilege_type
    FROM information_schema.table_privileges
    WHERE grantee = current_user
      AND table_schema = 'public'
      AND table_name IN ('tdr_bonds', 'audit_log', 'farmers')
    ORDER BY table_name, privilege_type
  `;
  console.log('App user grants on sample tables:', grants);

  const role = await prisma.$queryRaw<{ current_user: string }[]>`
    SELECT current_user
  `;
  console.log('Connected as:', role);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
