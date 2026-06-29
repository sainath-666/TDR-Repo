import { PrismaClient } from '@prisma/client';
import { getEffectiveBondDistrictCode } from '../src/lib/bond-helpers';

async function main() {
  const prisma = new PrismaClient();
  const bonds = await prisma.tdrBond.findMany({ include: { holder: true, creator: true } });
  let fixed = 0;
  for (const bond of bonds) {
    const code = getEffectiveBondDistrictCode(bond);
    if (bond.holder && code && bond.holder.district !== code) {
      await prisma.bondHolder.update({ where: { bondId: bond.id }, data: { district: code } });
      fixed += 1;
      console.log(`Fixed ${bond.tdrNumber}: ${bond.holder.district} -> ${code}`);
    }
  }
  console.log(`Done. Fixed ${fixed} bond(s).`);
  await prisma.$disconnect();
}

main().catch(console.error);
