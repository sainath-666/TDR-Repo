import { withErrorHandling, AuthenticationError, NotFoundError } from '@/lib/errors';
import { ok } from '@/lib/api-response';
import { getCurrentUser } from '@/lib/supabase/client';
import { prisma } from '@/lib/prisma';

export const GET = withErrorHandling(async (_req, { params }: { params: { cid: string } }) => {
  const user = await getCurrentUser();
  if (!user) throw new AuthenticationError();

  const doc = await prisma.bondDocument.findFirst({
    where: { ipfsCid: params.cid },
    include: { bond: { include: { holder: true } } },
  });

  if (!doc) throw new NotFoundError('document', params.cid);

  return ok({
    cid: doc.ipfsCid,
    fileName: doc.fileName,
    storagePath: doc.supabaseStoragePath,
    docType: doc.docType,
  });
});
