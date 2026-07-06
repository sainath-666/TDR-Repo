import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const columns = await prisma.$queryRaw<
    { column_name: string; data_type: string; is_nullable: string }[]
  >`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'tdr_bonds'
      AND column_name IN (
        'certificate_ipfs_cid',
        'certificate_storage_path',
        'minted_at',
        'fabric_tx_id'
      )
    ORDER BY column_name
  `;

  console.log('tdr_bonds certificate columns:');
  console.log(JSON.stringify(columns, null, 2));

  const sample = await prisma.tdrBond.findMany({
    where: { status: 'ACTIVE' },
    select: {
      id: true,
      tdrNumber: true,
      certificateIpfsCid: true,
      certificateStoragePath: true,
      mintedAt: true,
    },
    take: 3,
  });

  console.log('\nSample ACTIVE bonds:');
  console.log(JSON.stringify(sample, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
