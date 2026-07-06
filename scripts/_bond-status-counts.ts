import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const bonds = await prisma.tdrBond.groupBy({ by: ['status'], _count: true });
  console.log(JSON.stringify(bonds, null, 2));
}

main().finally(() => prisma.$disconnect());
