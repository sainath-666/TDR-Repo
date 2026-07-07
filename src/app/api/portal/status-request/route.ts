import { NextRequest } from 'next/server';
import { withErrorHandling } from '@/lib/errors';
import { created } from '@/lib/api-response';
import { writeAuditLog } from '@/lib/audit';
import { createTdrStatusCheckRequest } from '@/lib/status-check-request';
import {
  readStatusInquiryFiles,
  statusInquiryFieldsSchema,
} from '@/lib/validations/status-inquiry';

export const POST = withErrorHandling(async (req: NextRequest) => {
  const formData = await req.formData();
  const fields = statusInquiryFieldsSchema.parse({
    tdrNumber: formData.get('tdrNumber'),
    remarks: formData.get('remarks') || undefined,
  });

  const files = formData
    .getAll('documents')
    .filter((entry): entry is File => entry instanceof File);

  const parsedFiles = await readStatusInquiryFiles(files);
  const request = await createTdrStatusCheckRequest({
    tdrNumber: fields.tdrNumber,
    remarks: fields.remarks,
    files: parsedFiles,
  });

  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    undefined;

  await writeAuditLog({
    actorRole: 'PUBLIC',
    action: 'TDR_STATUS_INQUIRY_REQUEST',
    details: {
      requestId: request.id,
      referenceId: request.referenceId,
      tdrNumber: fields.tdrNumber,
      remarks: fields.remarks,
      documentCount: parsedFiles.length,
    },
    ipAddress: ip,
  });

  return created({ referenceId: request.referenceId });
});
