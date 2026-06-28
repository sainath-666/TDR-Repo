import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { withErrorHandling } from '@/lib/errors';
import { ok } from '@/lib/api-response';
import { createServerClient, getCurrentUser } from '@/lib/supabase/client';
import { writeAuditLog } from '@/lib/audit';
import { getClientIp } from '@/lib/bond-helpers';

export const POST = withErrorHandling(async (req: NextRequest) => {
  const user = await getCurrentUser(cookies());
  const supabase = createServerClient(cookies());
  await supabase.auth.signOut();

  if (user) {
    await writeAuditLog({
      actorId: user.id,
      actorRole: user.role,
      action: 'LOGOUT',
      ipAddress: getClientIp(req.headers),
    });
  }

  return ok({ message: 'Logged out' });
});
