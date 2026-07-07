import { createHash } from 'crypto';
import { createAdminClient } from '@/lib/supabase/admin';
import { ValidationError } from '@/lib/errors';

const DEFAULT_CERTIFICATES_BUCKET = 'tdr-certificates';
const LEGACY_LOCAL_PREFIX = 'storage/certificates/';
export const TDR_STATUS_CHECK_STORAGE_FOLDER = 'tdr-status-check';

export function getCertificatesBucket(): string {
  return process.env.SUPABASE_CERTIFICATES_BUCKET ?? DEFAULT_CERTIFICATES_BUCKET;
}

/** Folder prefix inside the certificates bucket for public status-check uploads. */
export function tdrStatusCheckStoragePrefix(requestId: string): string {
  return `${TDR_STATUS_CHECK_STORAGE_FOLDER}/${requestId}`;
}

/** Object path inside the Supabase Storage bucket for a status-check document. */
export function tdrStatusCheckDocumentPath(requestId: string, fileName: string): string {
  return `${tdrStatusCheckStoragePrefix(requestId)}/${fileName}`;
}

/** Object path inside the Supabase Storage bucket. */
export function certificateStorageObjectPath(bondId: string): string {
  return `certificates/${bondId}.pdf`;
}

export function isLegacyLocalCertificatePath(storagePath: string): boolean {
  return storagePath.replace(/\\/g, '/').startsWith(LEGACY_LOCAL_PREFIX);
}

/** True when bond metadata still points at local disk or pre-storage placeholder values. */
export function needsCertificateStorageBackfill(
  storagePath: string | null | undefined,
  contentHash: string | null | undefined,
): boolean {
  if (!storagePath || !contentHash) return true;
  if (isLegacyLocalCertificatePath(storagePath)) return true;
  if (contentHash.startsWith('bafy-cert-')) return true;
  return !storagePath.replace(/\\/g, '/').startsWith('certificates/');
}

export function certificateContentHash(pdfBuffer: Buffer): string {
  return createHash('sha256').update(pdfBuffer).digest('hex');
}

export async function uploadCertificatePdf(
  bondId: string,
  pdfBuffer: Buffer,
): Promise<{ storagePath: string; contentHash: string }> {
  const bucket = getCertificatesBucket();
  const storagePath = certificateStorageObjectPath(bondId);
  const supabase = createAdminClient();

  const { error } = await supabase.storage.from(bucket).upload(storagePath, pdfBuffer, {
    contentType: 'application/pdf',
    upsert: true,
    cacheControl: 'private, max-age=0',
  });

  if (error) {
    throw new ValidationError(`Failed to upload certificate to Supabase Storage: ${error.message}`);
  }

  return {
    storagePath,
    contentHash: certificateContentHash(pdfBuffer),
  };
}

export async function downloadCertificatePdf(storagePath: string): Promise<Buffer> {
  const bucket = getCertificatesBucket();
  const supabase = createAdminClient();

  const { data, error } = await supabase.storage.from(bucket).download(storagePath);

  if (error || !data) {
    throw new ValidationError('Certificate file not found in Supabase Storage');
  }

  return Buffer.from(await data.arrayBuffer());
}
