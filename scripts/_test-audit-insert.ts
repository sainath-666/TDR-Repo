import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const last = await prisma.auditLog.findFirst({ orderBy: { id: 'desc' }, select: { id: true } });
  const id = (last?.id ?? 0n) + 1n;
  await prisma.auditLog.create({
    data: {
      id,
      action: 'TEST_AUDIT_INSERT',
      chainHash: 'test-hash-' + id,
    },
  });
  console.log('OK inserted audit id', id.toString());
}

main()
  .catch((e) => console.error('FAIL', e.message))
  .finally(() => prisma.$disconnect());
