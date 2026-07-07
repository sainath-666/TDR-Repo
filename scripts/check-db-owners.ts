import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const owners = await prisma.$queryRaw<{ tablename: string; tableowner: string }[]>`
    SELECT tablename, tableowner
    FROM pg_tables
    WHERE schemaname = 'public' AND tablename IN ('tdr_bonds', 'audit_log', 'farmers')
    ORDER BY tablename
  `;
  console.log('Table owners:', owners);

  const roles = await prisma.$queryRaw<{ rolname: string; rolsuper: boolean }[]>`
    SELECT rolname, rolsuper
    FROM pg_roles
    WHERE rolname = current_user
  `;
  console.log('Current role:', roles);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
