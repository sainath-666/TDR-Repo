import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withErrorHandling } from '@/lib/errors';
import { checkFabricHealth } from '@/lib/fabric/gateway';
import { parseCerbosPdpUrl } from '@/lib/cerbos/config';

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

  const { healthUrl } = parseCerbosPdpUrl();
  try {
    const response = await fetch(healthUrl, {
      signal: AbortSignal.timeout(2000),
    });
    checks.cerbos = response.ok ? 'ok' : 'error';
  } catch {
    checks.cerbos = process.env.NODE_ENV === 'development' ? 'offline' : 'error';
  }

  checks.fabric = await checkFabricHealth();

  const isDev = process.env.NODE_ENV === 'development';
  const healthy =
    checks.database === 'ok' &&
    (checks.cerbos === 'ok' || (isDev && checks.cerbos === 'offline')) &&
    (checks.fabric === 'ok' || checks.fabric === 'mock' || (isDev && checks.fabric === 'offline'));
  return NextResponse.json(
    { success: healthy, data: { status: healthy ? 'healthy' : 'degraded', checks } },
    { status: healthy ? 200 : 503 },
  );
});
