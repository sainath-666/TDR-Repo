import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withErrorHandling } from '@/lib/errors';
import { checkFabricHealth } from '@/lib/fabric/gateway';

export const GET = withErrorHandling(async () => {
  const checks: Record<string, string> = {
    app: 'ok',
    database: 'unknown',
    cerbos: 'unknown',
    fabric: 'unknown',
  };

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = 'ok';
  } catch {
    checks.database = 'error';
  }

  const cerbosUrl = process.env.CERBOS_PDP_URL ?? 'localhost:3593';
  try {
    const response = await fetch(`http://${cerbosUrl.replace(':3593', ':3592')}/_cerbos/health`, {
      signal: AbortSignal.timeout(2000),
    });
    checks.cerbos = response.ok ? 'ok' : 'error';
  } catch {
    checks.cerbos = process.env.NODE_ENV === 'development' ? 'offline' : 'error';
  }

  checks.fabric = await checkFabricHealth();

  const ipfsUrl = process.env.IPFS_API_URL;
  if (ipfsUrl) {
    try {
      const response = await fetch(`${ipfsUrl}/api/v0/id`, {
        method: 'POST',
        signal: AbortSignal.timeout(2000),
      });
      checks.ipfs = response.ok ? 'ok' : 'error';
    } catch {
      checks.ipfs = process.env.NODE_ENV === 'development' ? 'offline' : 'error';
    }
  }

  const isDev = process.env.NODE_ENV === 'development';
  const healthy =
    checks.database === 'ok' &&
    (checks.cerbos === 'ok' || (isDev && checks.cerbos === 'offline')) &&
    (checks.fabric === 'ok' ||
      checks.fabric === 'mock' ||
      (isDev && checks.fabric === 'offline')) &&
    (!checks.ipfs || checks.ipfs === 'ok' || (isDev && checks.ipfs === 'offline'));
  return NextResponse.json(
    { success: healthy, data: { status: healthy ? 'healthy' : 'degraded', checks } },
    { status: healthy ? 200 : 503 },
  );
});
