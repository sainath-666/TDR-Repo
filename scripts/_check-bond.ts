import { PrismaClient } from '@prisma/client';
import { getEffectiveBondDistrictCode } from '../src/lib/bond-helpers';

const bondId = '9bcc7db6-f8ff-4bb5-af7c-547e43921f7e';

async function main() {
  const prisma = new PrismaClient();
  const bond = await prisma.tdrBond.findUnique({
    where: { id: bondId },
    include: { holder: true, creator: true },
  });
  console.log(
    JSON.stringify(
      {
        status: bond?.status,
        effectiveDistrict: bond ? getEffectiveBondDistrictCode(bond) : null,
        holderDistrict: bond?.holder?.district,
        creatorDistrict: bond?.creator?.districtCode,
      },
      null,
      2,
    ),
  );
  await prisma.$disconnect();
}

main().catch(console.error);
