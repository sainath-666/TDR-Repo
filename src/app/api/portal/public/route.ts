import { withErrorHandling } from '@/lib/errors';
import { ok } from '@/lib/api-response';
import { getEntitlementEntries, getPortalStats, getTdrBankEntries } from '@/lib/portal-stats';

export const GET = withErrorHandling(async (req: Request) => {
  const { searchParams } = new URL(req.url);
  const resource = searchParams.get('resource') ?? 'stats';

  switch (resource) {
    case 'tdr-bank':
      return ok(await getTdrBankEntries());
    case 'entitlements': {
      const limit = parseInt(searchParams.get('limit') ?? '100', 10);
      return ok(await getEntitlementEntries(limit));
    }
    case 'stats':
    default:
      return ok(await getPortalStats());
  }
});
