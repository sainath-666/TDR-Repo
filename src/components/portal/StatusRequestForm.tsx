'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, FileText, Upload, X } from 'lucide-react';
import { PortalPageShell } from '@/components/layout/PortalPageShell';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useLocale } from '@/lib/i18n/locale-context';
import {
  STATUS_INQUIRY_ALLOWED_TYPES,
  STATUS_INQUIRY_MAX_FILE_BYTES,
  STATUS_INQUIRY_MAX_FILES,
} from '@/lib/validations/status-inquiry';

interface StatusRequestFormProps {
  initialTdrNumber?: string;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function StatusRequestForm({ initialTdrNumber = '' }: StatusRequestFormProps) {
  const { t } = useLocale();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [tdrNumber, setTdrNumber] = useState(initialTdrNumber);
  const [documents, setDocuments] = useState<File[]>([]);
  const [remarks, setRemarks] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [referenceId, setReferenceId] = useState<string | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []);
    if (selected.length === 0) return;

    setError('');
    setDocuments((prev) => {
      const merged = [...prev, ...selected];
      return merged.slice(0, STATUS_INQUIRY_MAX_FILES);
    });
    e.target.value = '';
  }

  function removeDocument(index: number) {
    setDocuments((prev) => prev.filter((_, i) => i !== index));
  }

  function validateClient(): string | null {
    if (!tdrNumber.trim()) return t.statusPage.errorNoCert;
    if (documents.length === 0) return t.statusPage.errorNoDocuments;

    for (const file of documents) {
      if (!STATUS_INQUIRY_ALLOWED_TYPES.has(file.type)) {
        return t.statusPage.errorInvalidDocument.replace('{fileName}', file.name);
      }
      if (file.size > STATUS_INQUIRY_MAX_FILE_BYTES) {
        return t.statusPage.errorDocumentTooLarge.replace('{fileName}', file.name);
      }
    }

    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const validationError = validateClient();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('tdrNumber', tdrNumber.trim());
      if (remarks.trim()) formData.append('remarks', remarks.trim());
      for (const file of documents) {
        formData.append('documents', file);
      }

      const res = await fetch('/api/portal/status-request', {
        method: 'POST',
        body: formData,
      });

      const json = (await res.json()) as {
        success: boolean;
        data?: { referenceId: string };
        error?: string;
      };

      if (!res.ok || !json.success) {
        setError(json.error ?? t.statusPage.requestError);
        return;
      }

      setReferenceId(json.data?.referenceId ?? null);
    } catch {
      setError(t.statusPage.requestError);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PortalPageShell title={t.statusPage.requestTitle} subtitle={t.statusPage.requestSubtitle}>
      <div className="mx-auto max-w-xl">
        <Link
          href="/status"
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--portal-purple)] hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          {t.statusPage.backToSearch}
        </Link>

        {referenceId ? (
          <Card>
            <div className="flex flex-col items-center py-6 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
                <CheckCircle2 className="h-7 w-7 text-emerald-600" />
              </div>
              <h2 className="text-lg font-bold text-slate-800">
                {t.statusPage.requestSuccessTitle}
              </h2>
              <p className="mt-2 text-sm text-slate-600">{t.statusPage.requestSuccessMessage}</p>
              <p className="mt-4 rounded-lg bg-slate-50 px-4 py-2 font-mono text-sm font-semibold text-[var(--portal-blue)]">
                {referenceId}
              </p>
              <Button href="/status" variant="outline" className="mt-6">
                {t.statusPage.backToSearch}
              </Button>
            </div>
          </Card>
        ) : (
          <Card>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="req-tdr"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  {t.statusPage.enterCertNo}
                  <span className="text-red-600">*</span>
                </label>
                <input
                  id="req-tdr"
                  type="text"
                  value={tdrNumber}
                  onChange={(e) => setTdrNumber(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[var(--portal-purple)] focus:outline-none focus:ring-1 focus:ring-[var(--portal-purple)]"
                  placeholder={t.statusPage.certPlaceholder}
                  required
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  {t.statusPage.documents}
                  <span className="text-red-600">*</span>
                </label>
                <p className="mb-2 text-xs text-slate-500">{t.statusPage.documentsHint}</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm font-medium text-slate-600 transition-colors hover:border-[var(--portal-purple)] hover:bg-purple-50/40"
                >
                  <Upload className="h-5 w-5" />
                  {t.statusPage.uploadDocuments}
                </button>

                {documents.length > 0 && (
                  <ul className="mt-3 space-y-2">
                    {documents.map((file, index) => (
                      <li
                        key={`${file.name}-${file.size}-${index}`}
                        className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2"
                      >
                        <FileText className="h-4 w-4 shrink-0 text-[var(--portal-blue)]" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-slate-800">{file.name}</p>
                          <p className="text-xs text-slate-500">{formatFileSize(file.size)}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeDocument(index)}
                          className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-red-600"
                          aria-label={t.statusPage.removeDocument}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <label
                  htmlFor="req-remarks"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  {t.statusPage.remarks}
                </label>
                <textarea
                  id="req-remarks"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[var(--portal-purple)] focus:outline-none focus:ring-1 focus:ring-[var(--portal-purple)]"
                  placeholder={t.statusPage.remarksPlaceholder}
                />
              </div>

              {error && <p className="text-sm font-medium text-red-600">{error}</p>}

              <Button
                type="submit"
                disabled={submitting}
                className="w-full bg-teal-600 hover:bg-teal-700"
              >
                {submitting ? t.statusPage.submittingRequest : t.statusPage.submitRequest}
              </Button>
            </form>
          </Card>
        )}
      </div>
    </PortalPageShell>
  );
}
