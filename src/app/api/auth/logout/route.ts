import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandling } from '@/lib/errors';
import { getCurrentUser } from '@/lib/supabase/client';
import { writeAuditLog } from '@/lib/audit';
import { getClientIp } from '@/lib/bond-helpers';
import { clearCitizenSessionCookie } from '@/lib/citizen-session';
import { createRouteHandlerClient } from '@/lib/supabase/route-handler';

export const POST = withErrorHandling(async (req: NextRequest) => {
  const user = await getCurrentUser();

  const response = NextResponse.json({ success: true, data: { message: 'Logged out' } });
  clearCitizenSessionCookie(response);

  if (user?.role !== 'FARMER') {
    const supabase = createRouteHandlerClient(req, response);
    await supabase.auth.signOut();
  }

  response.cookies.delete('last_active');

  if (user) {
    await writeAuditLog({
      actorId: user.id,
      actorRole: user.role,
      action: 'LOGOUT',
      ipAddress: getClientIp(req.headers),
    });
  }

  return response;
});
