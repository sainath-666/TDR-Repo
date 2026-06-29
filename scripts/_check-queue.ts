import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  const bonds = await prisma.tdrBond.findMany({
    where: { status: 'PENDING_L1' },
    include: { holder: true },
  });
  const tah = await prisma.official.findFirst({ where: { role: 'DY_TAHSILDAR' } });
  console.log(
    JSON.stringify(
      {
        tahsildarDistrict: tah?.districtCode,
        pendingL1: bonds.map((b) => ({
          tdrNumber: b.tdrNumber,
          holderDistrict: b.holder?.district,
          status: b.status,
        })),
      },
      null,
      2,
    ),
  );
  await prisma.$disconnect();
}

main().catch(console.error);
