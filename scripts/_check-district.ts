import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  const bond = await prisma.tdrBond.findFirst({
    orderBy: { createdAt: 'desc' },
    include: { holder: true },
  });
  const deo = await prisma.official.findFirst({ where: { role: 'DEO' } });

  console.log(
    JSON.stringify(
      {
        bondStatus: bond?.status,
        holderDistrict: bond?.holder?.district,
        deoDistrict: deo?.districtCode,
        createdBy: bond?.createdBy,
        deoId: deo?.id,
      },
      null,
      2,
    ),
  );

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
