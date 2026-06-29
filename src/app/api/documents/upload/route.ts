import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { createHash } from 'crypto';
import { withErrorHandling, AuthenticationError, ValidationError } from '@/lib/errors';
import { ok, created } from '@/lib/api-response';
import { getCurrentUser } from '@/lib/supabase/client';
import { withCerbos } from '@/lib/cerbos/enforce';
import { prisma } from '@/lib/prisma';
import { writeAuditLog } from '@/lib/audit';
import { documentUploadSchema } from '@/lib/validations/bond';
import {
  getBondWithRelations,
  getClientIp,
  getEffectiveBondDistrictCode,
} from '@/lib/bond-helpers';
import { DocumentType } from '@prisma/client';
import { isOfficialRole } from '@/types';

const ALLOWED_MIME: Record<string, DocumentType[]> = {
  'application/pdf': Object.values(DocumentType),
  'image/jpeg': Object.values(DocumentType),
  'image/png': Object.values(DocumentType),
};

export const POST = withErrorHandling(async (req: NextRequest) => {
  const user = await getCurrentUser(cookies());
  if (!user || !isOfficialRole(user.role)) throw new AuthenticationError();

  const formData = await req.formData();
  const bondId = formData.get('bondId') as string;
  const docType = formData.get('docType') as DocumentType;
  const file = formData.get('file') as File;

  documentUploadSchema.parse({ bondId, docType });

  if (!file) throw new ValidationError('File is required');
  const mime = file.type;
  if (!ALLOWED_MIME[mime]?.includes(docType)) {
    throw new ValidationError(`Invalid file type ${mime} for document ${docType}`);
  }
  if (file.size > 10 * 1024 * 1024) throw new ValidationError('File exceeds 10MB limit');

  const bond = await getBondWithRelations(bondId);
  const districtCode = getEffectiveBondDistrictCode(bond);

  const cerbosCallId = await withCerbos(
    user,
    {
      kind: 'bond',
      id: bondId,
      attributes: { status: bond.status, districtCode },
    },
    'upload_document',
  );

  const buffer = Buffer.from(await file.arrayBuffer());
  const sha256Hash = createHash('sha256').update(buffer).digest('hex');
  const storagePath = `${bondId}/${docType}/${file.name}`;
  const ipfsCid = `bafy${sha256Hash.slice(0, 40)}`;

  const existing = await prisma.bondDocument.findFirst({
    where: { bondId, docType },
  });

  const doc = existing
    ? await prisma.bondDocument.update({
        where: { id: existing.id },
        data: {
          ipfsCid,
          supabaseStoragePath: storagePath,
          sha256Hash,
          fileName: file.name,
          fileSizeKb: Math.ceil(file.size / 1024),
          uploadedBy: user.id,
          uploadedAt: new Date(),
        },
      })
    : await prisma.bondDocument.create({
        data: {
          bondId,
          docType,
          ipfsCid,
          supabaseStoragePath: storagePath,
          sha256Hash,
          fileName: file.name,
          fileSizeKb: Math.ceil(file.size / 1024),
          uploadedBy: user.id,
        },
      });

  await writeAuditLog({
    bondId,
    actorId: user.id,
    actorRole: user.role,
    action: 'DOCUMENT_UPLOADED',
    details: { docType, fileName: file.name },
    cerbosCallId,
    ipAddress: getClientIp(req.headers),
  });

  return created({ documentId: doc.id, docType, ipfsCid });
});
