import { cookies } from 'next/headers';
import { withErrorHandling, AuthenticationError } from '@/lib/errors';
import { ok } from '@/lib/api-response';
import { getCurrentUser } from '@/lib/supabase/client';
import { composePrefillData } from '@/lib/integrations/apcrda-adapter';

export const GET = withErrorHandling(
  async (req: Request, { params }: { params: { surveyNo: string } }) => {
    const user = await getCurrentUser(cookies());
    if (!user) throw new AuthenticationError();

    const { searchParams } = new URL(req.url);
    const tdrNo = searchParams.get('tdrNo') ?? undefined;

    const prefill = await composePrefillData(
      decodeURIComponent(params.surveyNo),
      tdrNo ?? undefined,
    );
    return ok(prefill);
  },
);
