import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { withErrorHandling } from '@/lib/errors';
import { ok } from '@/lib/api-response';
import { createServerClient } from '@/lib/supabase/client';
import { writeAuditLog } from '@/lib/audit';
import { getClientIp } from '@/lib/bond-helpers';

export const POST = withErrorHandling(async (req: NextRequest) => {
  const supabase = createServerClient(cookies());

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google' as 'google',
    options: {
      redirectTo: `${req.nextUrl.origin}/deo/dashboard`,
    },
  });

  if (error) {
    return ok({ message: 'Configure NIC SSO in Supabase dashboard', redirect: '/official-login' });
  }

  await writeAuditLog({
    action: 'OFFICIAL_LOGIN',
    details: { provider: 'nic-sso' },
    ipAddress: getClientIp(req.headers),
  });

  return ok({ url: data.url });
});
