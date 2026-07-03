import { z } from 'zod';
import { DocumentType } from '@prisma/client';

export const documentUploadSchema = z.object({
  bondId: z.string().uuid(),
  docType: z.nativeEnum(DocumentType),
});

export const REQUIRED_DOCUMENT_TYPES = [
  DocumentType.OWNERSHIP_DOCUMENT,
  DocumentType.AADHAAR_COPY,
  DocumentType.RETURNABLE_PLOT_ALLOTMENT,
  DocumentType.TDR_ISSUED_COPY,
  DocumentType.INDIVIDUAL_SKETCH,
] as const;
