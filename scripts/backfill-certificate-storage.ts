/**
 * One-time backfill: regenerate certificate PDFs and upload to Supabase Storage,
 * then update tdr_bonds.certificate_storage_path and certificate_ipfs_cid.
 *
 * Usage:
 *   npm run cert:backfill
 *   npm run cert:backfill -- --dry-run
 *   npm run cert:backfill -- --origin https://your-domain
 */
import { BondStatus } from '@prisma/client';
import { prisma } from '../src/lib/prisma';
import { getBondWithRelations } from '../src/lib/bond-helpers';
import { generateBondCertificatePdfBuffer } from '../src/lib/certificate/mint';
import { needsCertificateStorageBackfill, uploadCertificatePdf } from '../src/lib/supabase/storage';

function parseArgs(argv: string[]) {
  const dryRun = argv.includes('--dry-run');
  const originFlag = argv.find((arg) => arg.startsWith('--origin='));
  const origin =
    originFlag?.slice('--origin='.length) ??
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.APP_URL ??
    'http://localhost:3000';

  return { dryRun, origin: origin.replace(/\/$/, '') };
}

async function main() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('ERROR: Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env');
    process.exit(1);
  }

  const { dryRun, origin } = parseArgs(process.argv.slice(2));
  console.log(`Certificate storage backfill (origin: ${origin})${dryRun ? ' [DRY RUN]' : ''}`);

  const bonds = await prisma.tdrBond.findMany({
    where: { status: BondStatus.ACTIVE },
    select: {
      id: true,
      tdrNumber: true,
      certificateStoragePath: true,
      certificateIpfsCid: true,
    },
    orderBy: { tdrNumber: 'asc' },
  });

  const targets = bonds.filter((bond) =>
    needsCertificateStorageBackfill(bond.certificateStoragePath, bond.certificateIpfsCid),
  );

  if (targets.length === 0) {
    console.log('No ACTIVE bonds need certificate storage backfill.');
    return;
  }

  console.log(`Found ${targets.length} bond(s) to backfill.\n`);

  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for (const target of targets) {
    const label = `${target.tdrNumber} (${target.id})`;
    try {
      const bond = await getBondWithRelations(target.id);
      if (!bond.holder || !bond.landDetails) {
        console.warn(`SKIP ${label}: missing holder or land details`);
        skipped += 1;
        continue;
      }

      const pdfBuffer = await generateBondCertificatePdfBuffer(
        bond,
        origin,
        'COMMISSIONER',
        bond.fabricTxId,
      );

      if (dryRun) {
        console.log(
          `DRY RUN ${label}: would upload certificates/${target.id}.pdf (${pdfBuffer.length} bytes)`,
        );
        updated += 1;
        continue;
      }

      const uploaded = await uploadCertificatePdf(target.id, pdfBuffer);

      await prisma.tdrBond.update({
        where: { id: target.id },
        data: {
          certificateStoragePath: uploaded.storagePath,
          certificateIpfsCid: uploaded.contentHash,
          mintedAt: bond.mintedAt ?? new Date(),
        },
      });

      console.log(
        `OK ${label}: ${uploaded.storagePath} (sha256 ${uploaded.contentHash.slice(0, 12)}…)`,
      );
      updated += 1;
    } catch (error) {
      failed += 1;
      const message = error instanceof Error ? error.message : String(error);
      console.error(`FAIL ${label}: ${message}`);
    }
  }

  console.log(`\nDone. updated=${updated} skipped=${skipped} failed=${failed}`);
  if (failed > 0) process.exit(1);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
