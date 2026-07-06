import { createHash } from 'crypto';
import type { Prisma } from '@prisma/client';
import { prisma } from './prisma';
import { redactSensitive, logger } from './logger';

const GENESIS_HASH = 'APCRDA-TDR-GENESIS-2026';

export interface AuditEntry {
  bondId?: string;
  actorId?: string;
  actorRole?: string;
  action: string;
  details?: unknown;
  ipAddress?: string;
  cerbosCallId?: string;
  fabricTxId?: string;
}

function computeChainHash(previousHash: string, payload: Record<string, unknown>): string {
  const data = `${previousHash}:${JSON.stringify(payload)}`;
  return createHash('sha256').update(data).digest('hex');
}

/** App-assigned ids — avoids DB sequence grants on restricted roles. */
export async function nextAuditLogId(
  tx: Prisma.TransactionClient | typeof prisma = prisma,
): Promise<bigint> {
  const last = await tx.auditLog.findFirst({
    orderBy: { id: 'desc' },
    select: { id: true },
  });
  return (last?.id ?? 0n) + 1n;
}

export async function writeAuditLog(entry: AuditEntry): Promise<void> {
  try {
    const lastEntry = await prisma.auditLog.findFirst({
      orderBy: { id: 'desc' },
      select: { chainHash: true, id: true },
    });
    const previousHash = lastEntry?.chainHash ?? GENESIS_HASH;

    const payload = {
      bondId: entry.bondId,
      actorId: entry.actorId,
      actorRole: entry.actorRole,
      action: entry.action,
      details: entry.details ? redactSensitive(entry.details) : undefined,
      ipAddress: entry.ipAddress,
      cerbosCallId: entry.cerbosCallId,
      fabricTxId: entry.fabricTxId,
      timestamp: new Date().toISOString(),
    };

    const chainHash = computeChainHash(previousHash, payload);
    const id = (lastEntry?.id ?? 0n) + 1n;

    await prisma.auditLog.create({
      data: {
        id,
        bondId: entry.bondId,
        actorId: entry.actorId,
        actorRole: entry.actorRole,
        action: entry.action,
        details: payload.details as object | undefined,
        ipAddress: entry.ipAddress,
        cerbosCallId: entry.cerbosCallId,
        fabricTxId: entry.fabricTxId,
        chainHash,
      },
    });
  } catch (err) {
    logger.error('Failed to write audit log', {
      action: entry.action,
      error: err instanceof Error ? err.message : 'Unknown',
    });
  }
}

export async function verifyAuditChain(
  fromId?: bigint,
): Promise<{ intact: boolean; brokenAtId?: bigint }> {
  const entries = await prisma.auditLog.findMany({
    where: fromId ? { id: { gte: fromId } } : undefined,
    orderBy: { id: 'asc' },
  });

  let previousHash = GENESIS_HASH;
  if (fromId) {
    const prior = await prisma.auditLog.findFirst({
      where: { id: { lt: fromId } },
      orderBy: { id: 'desc' },
      select: { chainHash: true },
    });
    previousHash = prior?.chainHash ?? GENESIS_HASH;
  }

  for (const entry of entries) {
    const payload = {
      bondId: entry.bondId,
      actorId: entry.actorId,
      actorRole: entry.actorRole,
      action: entry.action,
      details: entry.details ? redactSensitive(entry.details) : undefined,
      ipAddress: entry.ipAddress,
      cerbosCallId: entry.cerbosCallId,
      fabricTxId: entry.fabricTxId,
      timestamp: entry.createdAt.toISOString(),
    };

    const expected = computeChainHash(previousHash, payload);
    if (expected !== entry.chainHash) {
      return { intact: false, brokenAtId: entry.id };
    }
    previousHash = entry.chainHash;
  }

  return { intact: true };
}
