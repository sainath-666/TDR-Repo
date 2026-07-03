'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Download, Loader2 } from 'lucide-react';
import { TdrCertificatePreview } from '@/components/farmer/TdrCertificatePreview';
import type { CertificatePreviewData } from '@/lib/certificate/preview-data';
import { Button } from '@/components/ui/Button';

interface CertificateDownloadPageProps {
  bondId: string;
  tdrNumber: string;
  preview: CertificatePreviewData;
}

export function CertificateDownloadClient({
  bondId,
  tdrNumber,
  preview,
}: CertificateDownloadPageProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function downloadPdf() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/certificates/${bondId}/download`);
      if (!res.ok) {
        const json = (await res.json()) as { error?: string };
        throw new Error(json.error ?? 'Download failed');
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `${tdrNumber}-certificate.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Download failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-5 px-3 py-4 md:px-6 md:py-6">
      <Link
        href="/farmer/dashboard"
        className="inline-flex items-center gap-1.5 font-sans text-sm font-medium text-apcrda-primary hover:underline"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to My Bonds
      </Link>

      <div className="font-sans">
        <p className="mb-4 text-center text-xs font-medium uppercase tracking-widest text-slate-500">
          Official TDR Certificate · 3 Pages
        </p>
        <TdrCertificatePreview data={preview} />
      </div>

      {error && <p className="alert-banner-error">{error}</p>}

      <Button
        type="button"
        variant="accent"
        className="w-full"
        disabled={loading}
        onClick={() => void downloadPdf()}
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Preparing PDF…
          </>
        ) : (
          <>
            <Download className="h-4 w-4" />
            Download Certificate (PDF)
          </>
        )}
      </Button>

      <p className="text-center text-[11px] text-slate-500">
        Verify authenticity at{' '}
        <Link href={preview.verifyPath} className="text-apcrda-primary hover:underline">
          public verify page
        </Link>
      </p>
    </div>
  );
}
