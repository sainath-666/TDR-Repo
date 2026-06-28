'use client';

import { useState } from 'react';
import type { DocumentType } from '@prisma/client';

const DOC_LABELS: Record<DocumentType, { en: string; te: string }> = {
  OWNERSHIP_DOCUMENT: { en: 'Ownership Document', te: 'యాజమాన్య పత్రం' },
  AADHAAR_COPY: { en: 'Aadhaar Copy', te: 'ఆధార్ కాపీ' },
  RETURNABLE_PLOT_ALLOTMENT: { en: 'Returnable Plot Allotment', te: 'తిరిగి ఇచ్చే_plot' },
  TDR_ISSUED_COPY: { en: 'TDR Issued Copy', te: 'TDR జారీ కాపీ' },
  INDIVIDUAL_SKETCH: { en: 'Individual Sketch', te: 'వ్యక్తిగత sketch' },
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

    const res = await fetch('/api/documents/upload', { method: 'POST', body: formData });
    const data = await res.json();
    if (data.success) {
      setUploaded((prev) => new Set([...prev, docType]));
    }
    setUploading(null);
  }

  const allUploaded = requiredTypes.every((t) => uploaded.has(t));

  return (
    <div className="bg-white rounded-lg border p-6 space-y-4">
      <h2 className="font-semibold text-lg">Phase 3 — Document Upload</h2>
      <p className="text-sm text-slate-500">
        Upload all 5 required documents (PDF, JPEG, or PNG, max 10MB)
      </p>

      <div className="grid gap-4">
        {requiredTypes.map((docType) => (
          <div key={docType} className="border rounded-lg p-4 flex justify-between items-center">
            <div>
              <p className="font-medium">{DOC_LABELS[docType]?.en ?? docType}</p>
              <p className="text-sm text-slate-400">{DOC_LABELS[docType]?.te ?? ''}</p>
            </div>
            <div>
              {uploaded.has(docType) ? (
                <span className="text-green-600 text-sm">✓ Uploaded</span>
              ) : (
                <label className="cursor-pointer bg-apcrda-primary text-white px-3 py-1 rounded text-sm">
                  {uploading === docType ? 'Uploading...' : 'Upload'}
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
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

      <button
        onClick={onComplete}
        disabled={!allUploaded || loading}
        className="bg-apcrda-accent text-white px-6 py-2 rounded-lg disabled:opacity-50"
      >
        {loading ? 'Submitting...' : 'Submit Bond for Approval'}
      </button>
    </div>
  );
}
