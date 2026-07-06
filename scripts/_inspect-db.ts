import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const [bonds, approvalSteps, auditLogs, approvalByDecision, auditByAction] = await Promise.all([
    prisma.tdrBond.findMany({
      select: { tdrNumber: true, status: true },
      orderBy: { tdrNumber: 'asc' },
    }),
    prisma.approvalStep.count(),
    prisma.auditLog.count(),
    prisma.approvalStep.groupBy({
      by: ['decision'],
      _count: true,
    }),
    prisma.auditLog.groupBy({
      by: ['action'],
      _count: true,
    }),
  ]);

  console.log('=== tdr_bonds ===');
  console.log(`count: ${bonds.length}`);
  bonds.forEach((b) => console.log(`  ${b.tdrNumber} — ${b.status}`));

  console.log('\n=== approval_steps ===');
  console.log(`total rows: ${approvalSteps} (expected: ${bonds.length * 4} = 4 per bond)`);
  console.log('by decision:', approvalByDecision);

  console.log('\n=== audit_log ===');
  console.log(`total rows: ${auditLogs} (expected: ${bonds.length} seed entries)`);
  console.log('by action:', auditByAction);

  const oldAudit = await prisma.auditLog.findMany({
    where: { NOT: { action: 'BOND_SEED_DRAFT' } },
    select: { id: true, action: true, createdAt: true },
    take: 20,
  });
  if (oldAudit.length > 0) {
    console.log('\n⚠ Non-seed audit rows (leftover):', oldAudit);
  } else {
    console.log('\n✓ All audit_log rows are BOND_SEED_DRAFT only (fresh seed).');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
