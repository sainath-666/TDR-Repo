import { getCerbosClient } from './client';
import { AuthorizationError, IntegrationError } from '@/lib/errors';
import { writeAuditLog } from '@/lib/audit';
import { logger } from '@/lib/logger';
import type { CurrentUser, CerbosResource } from '@/types';

function isCerbosMockMode(): boolean {
  return process.env.CERBOS_MOCK_MODE === 'true';
}

function isCerbosUnavailableError(err: unknown): boolean {
  if (isCerbosMockMode()) return false;

  const msg = err instanceof Error ? err.message : String(err);
  const code = typeof err === 'object' && err !== null && 'code' in err ? Number(err.code) : NaN;

  return (
    code === 14 ||
    msg.includes('ECONNREFUSED') ||
    msg.includes('ECONNRESET') ||
    msg.includes('ETIMEDOUT') ||
    msg.includes('UNAVAILABLE') ||
    msg.includes('No connection established') ||
    msg.includes('Name resolution failed')
  );
}

function canSkipCerbosCheck(): boolean {
  if (process.env.CERBOS_REQUIRE_REAL === 'true') return false;
  if (isCerbosMockMode()) return true;
  return process.env.NODE_ENV !== 'production';
}

function mockCerbosCallId(): string {
  return `mock-cerbos-${crypto.randomUUID()}`;
}

export async function withCerbos(
  user: CurrentUser,
  resource: CerbosResource,
  action: string,
): Promise<string> {
  if (isCerbosMockMode()) {
    const cerbosCallId = mockCerbosCallId();
    logger.warn('Cerbos mock mode: skipping PDP check', {
      role: user.role,
      action,
      resource: `${resource.kind}/${resource.id}`,
      cerbosCallId,
    });
    return cerbosCallId;
  }

  const client = getCerbosClient();

  const principal = {
    id: user.id,
    roles: [user.role],
    attributes: {
      districtCode: user.districtCode ?? '',
      employeeId: user.employeeId ?? '',
      farmerId: user.farmerId ?? user.id,
    },
  };

  const cerbosResource = {
    kind: resource.kind,
    id: resource.id,
    attributes: (resource.attributes ?? {}) as Record<string, string | number | boolean>,
  };

  try {
    const result = await client.checkResource({
      principal,
      resource: cerbosResource,
      actions: [action],
    });

    const cerbosCallId = crypto.randomUUID();

    if (!result.isAllowed(action)) {
      logger.warn(`Cerbos DENY: ${user.role} ${action} on ${resource.kind}/${resource.id}`);

      void writeAuditLog({
        action: 'CERBOS_DENY',
        actorId: user.id,
        actorRole: user.role,
        details: { principal: user.id, role: user.role, resource, action },
        cerbosCallId,
      });

      throw new AuthorizationError(
        `Not allowed to ${action} on ${resource.kind}`,
        action,
        resource.kind,
      );
    }

    logger.debug(`Cerbos ALLOW: ${user.role} ${action} on ${resource.kind}/${resource.id}`, {
      cerbosCallId,
    });

    return cerbosCallId;
  } catch (err) {
    if (err instanceof AuthorizationError) throw err;

    if (isCerbosUnavailableError(err)) {
      if (canSkipCerbosCheck()) {
        const cerbosCallId = mockCerbosCallId();
        logger.warn('Cerbos PDP not running — skipping authorization check', { cerbosCallId });
        return cerbosCallId;
      }
      throw new IntegrationError(
        'Cerbos',
        503,
        'Authorization service unavailable. For local dev set CERBOS_MOCK_MODE=true, or start Cerbos: npm run stack:up',
      );
    }
    throw err;
  }
}
