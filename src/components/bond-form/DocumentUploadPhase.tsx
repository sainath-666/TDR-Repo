'use client';

import { useState } from 'react';
import type { DocumentType } from '@prisma/client';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FileText, FileUp, CheckCircle, Loader2, AlertCircle } from 'lucide-react';

const DOC_LABELS: Record<DocumentType, { en: string; te: string }> = {
  OWNERSHIP_DOCUMENT: { en: 'Ownership Document', te: 'యాజమాన్య పత్రం' },
  AADHAAR_COPY: { en: 'Aadhaar Copy', te: 'ఆధార్ కాపీ' },
  RETURNABLE_PLOT_ALLOTMENT: { en: 'Returnable Plot Allotment', te: 'తిరిగి ఇచ్చే ప్లాట్ కేటాయింపు' },
  TDR_ISSUED_COPY: { en: 'TDR Issued Copy', te: 'TDR జారీ కాపీ' },
  INDIVIDUAL_SKETCH: { en: 'Individual Sketch', te: 'వ్యక్తిగత స్కెచ్' },
};

interface Props {
  bondId: string;
  requiredTypes: readonly DocumentType[];
  onComplete: () => void;
  loading: boolean;
}

export function DocumentUploadPhase({ bondId, requiredTypes, onComplete, loading }: Props) {
  const [uploaded, setUploaded] = useState<Set<DocumentType>>(new Set());
  const [uploading, setUploading] = useState<DocumentType | null>(null);

  async function handleUpload(docType: DocumentType, file: File) {
    setUploading(docType);
    const formData = new FormData();
    formData.append('bondId', bondId);
    formData.append('docType', docType);
    formData.append('file', file);

    try {
      const res = await fetch('/api/documents/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.success) {
        setUploaded((prev) => new Set([...prev, docType]));
      }
    } catch (e) {
      console.error('Document upload failed:', e);
    } finally {
      setUploading(null);
    }
  }

  const allUploaded = requiredTypes.every((t) => uploaded.has(t));

  return (
    <Card padding="md" className="space-y-6">
      <div className="pb-3 border-b border-slate-100 relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-10 after:bg-apcrda-secondary">
        <h2 className="font-bold text-slate-800 text-lg leading-snug">Phase 3 — Document Upload</h2>
      </div>
        <div className="mt-2 flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-100 p-3 text-xs text-amber-800">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
          <div>
            <p className="font-semibold">Important upload requirements:</p>
            <p className="mt-0.5">Please upload all 5 required documents in PDF, JPEG, or PNG formats (maximum 10MB per file).</p>
          </div>
        </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {requiredTypes.map((docType) => (
          <div
            key={docType}
            className={`border rounded-2xl p-4 flex justify-between items-center transition-all duration-300 ${
              uploaded.has(docType)
                ? 'border-emerald-200 bg-emerald-50/50 shadow-sm'
                : 'border-slate-100 bg-white hover:border-slate-200 hover:shadow-sm'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                  uploaded.has(docType)
                    ? 'bg-emerald-100 text-emerald-600'
                    : 'bg-indigo-50 text-apcrda-primary'
                }`}
              >
                <FileText className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p
                  className={`text-sm font-bold truncate ${
                    uploaded.has(docType) ? 'text-emerald-800' : 'text-slate-800'
                  }`}
                >
                  {DOC_LABELS[docType]?.en ?? docType}
                </p>
                <p className="text-[11px] text-slate-400 font-telugu font-semibold">
                  {DOC_LABELS[docType]?.te ?? ''}
                </p>
              </div>
            </div>

            <div className="shrink-0 pl-2">
              {uploaded.has(docType) ? (
                <div className="flex items-center gap-1.5 rounded-full bg-emerald-100/60 px-3 py-1 text-xs font-bold text-emerald-700">
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                  Uploaded
                </div>
              ) : (
                <label
                  className={`inline-flex items-center gap-1.5 cursor-pointer px-3.5 py-2 rounded-xl text-xs font-bold text-white transition-all shadow-sm ${
                    uploading === docType
                      ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                      : 'bg-apcrda-primary hover:bg-apcrda-primary-light active:scale-95'
                  }`}
                >
                  {uploading === docType ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Uploading
                    </>
                  ) : (
                    <>
                      <FileUp className="h-3.5 w-3.5" />
                      Upload
                    </>
                  )}
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    disabled={uploading === docType}
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void handleUpload(docType, file);
                    }}
                  />
                </label>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end pt-4 border-t border-slate-100">
        <Button
          onClick={onComplete}
          disabled={!allUploaded || loading}
          size="lg"
          variant="accent"
          className="w-full sm:w-auto shadow-md"
        >
          {loading ? 'Submitting Bond...' : 'Submit Bond for Approval'}
        </Button>
      </div>
    </Card>
  );
}
