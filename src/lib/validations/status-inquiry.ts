import { z } from 'zod';
import { ValidationError } from '@/lib/errors';

export const STATUS_INQUIRY_MAX_FILES = 10;
export const STATUS_INQUIRY_MAX_FILE_BYTES = 5 * 1024 * 1024;

export const STATUS_INQUIRY_ALLOWED_TYPES = new Set(['application/pdf', 'image/jpeg', 'image/png']);

export const statusInquiryFieldsSchema = z.object({
  tdrNumber: z.string().trim().min(1, 'TDR certificate number is required'),
  remarks: z.string().trim().max(1000).optional(),
});

export type StatusInquiryFields = z.infer<typeof statusInquiryFieldsSchema>;

export interface ParsedStatusInquiryFile {
  name: string;
  buffer: Buffer;
  contentType: string;
  sizeKb: number;
}

function validateInquiryFile(file: File): void {
  const contentType = file.type || 'application/octet-stream';

  if (!STATUS_INQUIRY_ALLOWED_TYPES.has(contentType)) {
    throw new ValidationError('Only PDF, JPG, and PNG files are allowed', {
      documents: `${file.name}: unsupported file type`,
    });
  }

  if (file.size > STATUS_INQUIRY_MAX_FILE_BYTES) {
    throw new ValidationError('Each document must be 5 MB or smaller', {
      documents: `${file.name}: file is too large`,
    });
  }
}

export async function readStatusInquiryFiles(files: File[]): Promise<ParsedStatusInquiryFile[]> {
  const validFiles = files.filter((file) => file.size > 0);

  if (validFiles.length === 0) {
    throw new ValidationError('At least one document is required', {
      documents: 'Upload at least one document',
    });
  }

  if (validFiles.length > STATUS_INQUIRY_MAX_FILES) {
    throw new ValidationError(`Maximum ${STATUS_INQUIRY_MAX_FILES} documents allowed`, {
      documents: `You can upload up to ${STATUS_INQUIRY_MAX_FILES} documents`,
    });
  }

  const parsed: ParsedStatusInquiryFile[] = [];

  for (const file of validFiles) {
    validateInquiryFile(file);
    parsed.push({
      name: file.name,
      buffer: Buffer.from(await file.arrayBuffer()),
      contentType: file.type || 'application/octet-stream',
      sizeKb: Math.ceil(file.size / 1024),
    });
  }

  return parsed;
}
