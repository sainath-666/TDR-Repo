import { PrismaClient } from '@prisma/client';

const TABLES = [
  'audit_log',
  'approval_steps',
  'bond_documents',
  'bond_holders',
  'bond_land_details',
  'tdr_status_check_documents',
  'tdr_status_check_requests',
  'tdr_bonds',
  'otp_requests',
  'idempotency_cache',
  'farmers',
  'officials',
  'villages',
] as const;

export async function truncateAllTables(prisma: PrismaClient): Promise<void> {
  try {
    await prisma.$executeRawUnsafe(`
      TRUNCATE TABLE
        ${TABLES.join(',\n        ')}
      CASCADE
    `);
    console.log('Truncated all application tables.');
  } catch (error) {
    console.warn('TRUNCATE unavailable — falling back to deleteMany:', error);
    await prisma.$transaction([
      prisma.auditLog.deleteMany(),
      prisma.approvalStep.deleteMany(),
      prisma.bondDocument.deleteMany(),
      prisma.bondHolder.deleteMany(),
      prisma.bondLandDetail.deleteMany(),
      prisma.tdrStatusCheckDocument.deleteMany(),
      prisma.tdrStatusCheckRequest.deleteMany(),
      prisma.tdrBond.deleteMany(),
      prisma.otpRequest.deleteMany(),
      prisma.idempotencyCache.deleteMany(),
      prisma.farmer.deleteMany(),
      prisma.official.deleteMany(),
      prisma.village.deleteMany(),
    ]);
    console.log('Deleted all rows from application tables.');
  }
}

async function main() {
  const prisma = new PrismaClient();
  try {
    console.log('Wiping all data...');
    await truncateAllTables(prisma);

    const counts = await Promise.all([
      prisma.tdrBond.count(),
      prisma.approvalStep.count(),
      prisma.auditLog.count(),
      prisma.farmer.count(),
      prisma.official.count(),
      prisma.village.count(),
    ]);

    console.log('Row counts after truncate:');
    console.log({
      tdr_bonds: counts[0],
      approval_steps: counts[1],
      audit_log: counts[2],
      farmers: counts[3],
      officials: counts[4],
      villages: counts[5],
    });
  } finally {
    await prisma.$disconnect();
  }
}

const isCli =
  typeof process.argv[1] === 'string' &&
  process.argv[1].replace(/\\/g, '/').endsWith('scripts/truncate-all-tables.ts');

if (isCli) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
