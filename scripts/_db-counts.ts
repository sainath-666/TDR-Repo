import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const [bonds, farmers, officials, audit] = await Promise.all([
    prisma.tdrBond.count(),
    prisma.farmer.count(),
    prisma.official.count(),
    prisma.auditLog.count(),
  ]);

  const draft = await prisma.tdrBond.count({ where: { status: 'DRAFT' } });

  console.log('DB counts after seed:');
  console.log({ bonds, draft, farmers, officials, audit });
}

main().finally(() => prisma.$disconnect());
