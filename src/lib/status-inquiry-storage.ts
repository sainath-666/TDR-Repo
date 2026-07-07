import { createAdminClient } from '@/lib/supabase/admin';
import { getCertificatesBucket, tdrStatusCheckDocumentPath } from '@/lib/supabase/storage';
import { ValidationError } from '@/lib/errors';
import type { ParsedStatusInquiryFile } from '@/lib/validations/status-inquiry';

export interface UploadedInquiryDocument {
  fileName: string;
  storagePath: string;
  sizeKb: number;
  contentType: string;
}

function sanitizeFileName(name: string): string {
  const base = name.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/_+/g, '_');
  return base.slice(0, 120) || 'document';
}

function uniqueFileName(name: string, used: Set<string>): string {
  const safeName = sanitizeFileName(name);
  if (!used.has(safeName)) {
    used.add(safeName);
    return safeName;
  }

  const dotIndex = safeName.lastIndexOf('.');
  const stem = dotIndex > 0 ? safeName.slice(0, dotIndex) : safeName;
  const ext = dotIndex > 0 ? safeName.slice(dotIndex) : '';

  let counter = 2;
  while (used.has(`${stem}_${counter}${ext}`)) {
    counter += 1;
  }

  const unique = `${stem}_${counter}${ext}`;
  used.add(unique);
  return unique;
}

export async function uploadStatusInquiryDocuments(
  requestId: string,
  files: ParsedStatusInquiryFile[],
): Promise<UploadedInquiryDocument[]> {
  const bucket = getCertificatesBucket();
  const supabase = createAdminClient();
  const results: UploadedInquiryDocument[] = [];
  const usedNames = new Set<string>();

  for (const file of files) {
    const safeName = uniqueFileName(file.name, usedNames);
    const storagePath = tdrStatusCheckDocumentPath(requestId, safeName);

    const { error } = await supabase.storage.from(bucket).upload(storagePath, file.buffer, {
      contentType: file.contentType,
      upsert: false,
      cacheControl: 'private, max-age=0',
    });

    if (error) {
      throw new ValidationError(`Failed to upload ${file.name}: ${error.message}`);
    }

    results.push({
      fileName: file.name,
      storagePath,
      sizeKb: file.sizeKb,
      contentType: file.contentType,
    });
  }

  return results;
}

export async function deleteStatusInquiryDocuments(storagePaths: string[]): Promise<void> {
  if (storagePaths.length === 0) return;

  const bucket = getCertificatesBucket();
  const supabase = createAdminClient();
  const { error } = await supabase.storage.from(bucket).remove(storagePaths);

  if (error) {
    throw new ValidationError(`Failed to clean up uploaded documents: ${error.message}`);
  }
}

export async function downloadStatusInquiryDocument(storagePath: string): Promise<Buffer> {
  const bucket = getCertificatesBucket();
  const supabase = createAdminClient();

  const { data, error } = await supabase.storage.from(bucket).download(storagePath);

  if (error || !data) {
    throw new ValidationError('Document file not found in storage');
  }

  return Buffer.from(await data.arrayBuffer());
}
