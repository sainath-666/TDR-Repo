import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withErrorHandling } from '@/lib/errors';
import { ok } from '@/lib/api-response';

export const GET = withErrorHandling(async () => {
  const checks: Record<string, string> = {
    app: 'ok',
    database: 'unknown',
    cerbos: 'unknown',
    fabric: 'mock',
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

  if (process.env.FABRIC_MOCK_MODE === 'true' || !process.env.FABRIC_CERT_PATH) {
    checks.fabric = 'mock';
  }

  const healthy = checks.database === 'ok';
  return NextResponse.json(
    { success: healthy, data: { status: healthy ? 'healthy' : 'degraded', checks } },
    { status: healthy ? 200 : 503 },
  );
});
