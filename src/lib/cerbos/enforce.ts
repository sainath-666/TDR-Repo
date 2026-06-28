import { getCerbosClient } from './client';
import { AuthorizationError } from '@/lib/errors';
import { writeAuditLog } from '@/lib/audit';
import { logger } from '@/lib/logger';
import type { CurrentUser, CerbosResource } from '@/types';

export async function withCerbos(
  user: CurrentUser,
  resource: CerbosResource,
  action: string,
): Promise<string> {
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
}
