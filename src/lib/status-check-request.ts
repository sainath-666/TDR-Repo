import { prisma } from '@/lib/prisma';
import {
  deleteStatusInquiryDocuments,
  uploadStatusInquiryDocuments,
} from '@/lib/status-inquiry-storage';
import type { ParsedStatusInquiryFile } from '@/lib/validations/status-inquiry';

function createReferenceId(): string {
  return `INQ-${Date.now().toString(36).toUpperCase()}`;
}

export async function createTdrStatusCheckRequest(input: {
  tdrNumber: string;
  remarks?: string;
  files: ParsedStatusInquiryFile[];
}): Promise<{ id: string; referenceId: string }> {
  const referenceId = createReferenceId();

  const request = await prisma.tdrStatusCheckRequest.create({
    data: {
      referenceId,
      tdrNumber: input.tdrNumber,
      remarks: input.remarks,
    },
  });

  let uploadedDocuments: Awaited<ReturnType<typeof uploadStatusInquiryDocuments>> = [];

  try {
    uploadedDocuments = await uploadStatusInquiryDocuments(request.id, input.files);

    await prisma.tdrStatusCheckDocument.createMany({
      data: uploadedDocuments.map((doc) => ({
        requestId: request.id,
        fileName: doc.fileName,
        storagePath: doc.storagePath,
        contentType: doc.contentType,
        sizeKb: doc.sizeKb,
      })),
    });

    return { id: request.id, referenceId };
  } catch (error) {
    if (uploadedDocuments.length > 0) {
      await deleteStatusInquiryDocuments(uploadedDocuments.map((doc) => doc.storagePath)).catch(
        () => undefined,
      );
    }

    await prisma.tdrStatusCheckRequest.delete({ where: { id: request.id } }).catch(() => undefined);
    throw error;
  }
}
