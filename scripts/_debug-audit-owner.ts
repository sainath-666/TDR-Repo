import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const owners = await prisma.$queryRaw<
    { tableowner: string; tablename: string }[]
  >`SELECT tableowner, tablename FROM pg_tables WHERE tablename = 'audit_log'`;

  const seqOwner = await prisma.$queryRaw<
    { sequenceowner: string }[]
  >`SELECT sequenceowner FROM pg_sequences WHERE sequencename = 'audit_log_id_seq'`;

  const tablePrivs = await prisma.$queryRaw<
    { privilege_type: string }[]
  >`SELECT privilege_type FROM information_schema.table_privileges WHERE table_name = 'audit_log' AND grantee = current_user`;

  console.log('table owners:', owners);
  console.log('seq owner:', seqOwner);
  console.log('table privs for current user:', tablePrivs);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
