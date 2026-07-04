'use client';

import { useState } from 'react';
import type { TdrBondWithRelations, UserRole } from '@/types';
import type { BondReviewDisplay } from '@/lib/bond-review-display';
import { BondReviewBody } from '@/components/approval/BondReviewSections';
import { ReturnRemarkBanner } from '@/components/approval/ReturnRemarkBanner';
import { ApprovalTrailPipeline } from '@/components/approval/ApprovalTrailCompact';
import {
  CheckCircle2,
  XCircle,
  Undo2,
  Download,
  Loader2,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { BondStatus } from '@prisma/client';
import { DOCUMENT_REVIEW_SPECS } from '@/lib/bond-review-fields';
import { getLatestReturnRemark } from '@/lib/return-remark';

type ReviewDocument = TdrBondWithRelations['documents'][number];

function documentLabel(docType: ReviewDocument['docType']): string {
  return DOCUMENT_REVIEW_SPECS.find((s) => s.type === docType)?.label ?? docType;
}

function reviewDirective(role: UserRole): string {
  switch (role) {
    case 'DEO':
    case 'SURVEYOR':
      return 'Verify synced holder details, land records, and all five documents before forwarding.';
    case 'TAHSILDAR':
    case 'DY_TAHSILDAR':
      return 'Confirm identity, Aadhaar, and land records against tahsil office records.';
    case 'SDC':
      return 'Verify survey boundaries, deed numbers, and surrendered area (Sq Yards).';
    case 'DIRECTOR_LANDS':
      return 'Review TDR extent, authority-decided ratio, and regulatory compliance.';
    case 'COMMISSIONER':
    case 'ADDL_COMMISSIONER':
      return 'Grant final approval to mint the TDR certificate on blockchain.';
    default:
      return 'Review all fields and documents before taking action.';
  }
}

interface Props {
  bond: TdrBondWithRelations;
  userRole: UserRole;
  reviewDisplay: BondReviewDisplay;
  returnPath?: string;
  /** When false, bond details are view-only (no approve/reject/return). */
  canAct?: boolean;
}

export function BondReviewPanel({
  bond,
  userRole,
  reviewDisplay,
  returnPath = '/official/dashboard',
  canAct = true,
}: Props) {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [action, setAction] = useState<'approve' | 'reject' | 'return' | null>(null);
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [docDetail, setDocDetail] = useState<ReviewDocument | null>(null);

  const returnRemark =
    bond.status === BondStatus.DRAFT ? getLatestReturnRemark(bond.approvalSteps) : null;

  function confirmMessage(type: 'approve' | 'reject' | 'return'): string {
    switch (type) {
      case 'approve':
        return 'Are you sure you want to approve this application? This action will be recorded in the approval chain.';
      case 'reject':
        return 'Are you sure you want to reject this application? This action cannot be undone.';
      case 'return':
        return 'The bond will revert to draft status for DEO correction. Continue?';
    }
  }

  async function handleAction(type: 'approve' | 'reject' | 'return') {
    setLoading(true);
    setError('');
    try {
      const endpoint =
        type === 'approve'
          ? `/api/approvals/${bond.id}/approve`
          : type === 'reject'
            ? `/api/approvals/${bond.id}/reject`
            : `/api/approvals/${bond.id}/return`;

      const body =
        type === 'return'
          ? { remarks: remarks.trim() }
          : { remarks: type === 'reject' ? remarks.trim() : undefined };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as {
        success: boolean;
        error?: string;
        fields?: Record<string, string>;
      };
      if (!data.success) {
        const fieldMsg = data.fields ? Object.values(data.fields).join(' ') : '';
        throw new Error(fieldMsg || data.error || 'Action failed');
      }
      // Hard navigation is faster than router.push + refresh (avoids double RSC load)
      window.location.assign(returnPath);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Action failed');
      setLoading(false);
      setShowConfirmModal(false);
    }
  }

  return (
    <>
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-5 items-start">
        <div className="min-w-0 space-y-4">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 flex items-center gap-2 text-sm text-red-700">
              <XCircle className="h-4 w-4 shrink-0" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          {returnRemark && <ReturnRemarkBanner remark={returnRemark} />}

          <BondReviewBody bond={bond} display={reviewDisplay} onViewDocument={setDocDetail} />
          <ApprovalTrailPipeline steps={bond.approvalSteps} />
        </div>

        <div className="xl:sticky xl:top-4">
          <Card padding="sm" className="space-y-4">
            <div className="flex items-start gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 ring-1 ring-indigo-100">
                <ShieldCheck className="h-4 w-4 text-apcrda-primary" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">
                  {canAct ? 'Review checklist' : 'Bond record (view only)'}
                </p>
                <p className="text-xs text-slate-600 leading-relaxed mt-1">
                  {canAct
                    ? reviewDirective(userRole)
                    : 'This bond is not awaiting your action. You can review holder, land, and document details below.'}
                </p>
              </div>
            </div>

            {canAct ? (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    setAction('approve');
                    setShowConfirmModal(true);
                  }}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl py-2.5 px-4 text-sm font-bold text-white shadow-sm bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 transition-all"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Approve Application
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAction('reject');
                    setRemarks('');
                    setShowConfirmModal(true);
                  }}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl py-2.5 px-4 text-sm font-bold text-white shadow-sm bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 transition-all"
                >
                  <XCircle className="h-4 w-4" />
                  Reject Application
                </button>
                {userRole !== 'DEO' && userRole !== 'SURVEYOR' && (
                  <button
                    type="button"
                    onClick={() => {
                      setAction('return');
                      setRemarks('');
                      setShowConfirmModal(true);
                    }}
                    disabled={loading}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl py-2.5 px-4 text-sm font-bold text-white shadow-sm bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 transition-all disabled:opacity-50"
                  >
                    <Undo2 className="h-4 w-4" />
                    Return to DEO
                  </button>
                )}
              </div>
            ) : (
              <p className="rounded-lg bg-slate-50 px-3 py-2 text-[11px] text-slate-600 ring-1 ring-slate-100">
                Approval actions are available only when the bond is in your queue.
              </p>
            )}
          </Card>
        </div>
      </div>

      {showConfirmModal && action && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl border border-slate-100">
            <div className="text-center mb-4">
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 mb-2">
                <AlertTriangle className="h-5 w-5 text-apcrda-primary" />
              </div>
              <h3 className="font-bold text-slate-900">
                {action === 'approve'
                  ? 'Confirm Approval'
                  : action === 'reject'
                    ? 'Confirm Rejection'
                    : 'Return to DEO'}
              </h3>
              <p className="text-xs text-slate-500 mt-1">{confirmMessage(action)}</p>
            </div>

            {(action === 'reject' || action === 'return') && (
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Remarks (minimum 10 characters)"
                className="input-field p-3 text-sm resize-none w-full mb-3"
                rows={3}
              />
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleAction(action)}
                disabled={
                  loading ||
                  ((action === 'reject' || action === 'return') && remarks.trim().length < 10)
                }
                className="flex-1 rounded-xl bg-apcrda-primary text-white text-sm font-bold py-2.5 disabled:opacity-50 shadow-sm"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : 'Confirm'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowConfirmModal(false);
                  setError('');
                }}
                disabled={loading}
                className="flex-1 border border-slate-200 text-sm font-bold py-2.5 rounded-xl hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {docDetail && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900">Document Details</h3>
              <button
                type="button"
                onClick={() => setDocDetail(null)}
                className="text-slate-400 hover:text-slate-600 text-xl leading-none"
              >
                &times;
              </button>
            </div>
            <dl className="space-y-3 text-sm mb-4">
              <div>
                <dt className="text-xs font-medium text-slate-500">Document type</dt>
                <dd className="font-semibold text-slate-900 mt-0.5">
                  {documentLabel(docDetail.docType)}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-slate-500">File name</dt>
                <dd className="font-mono text-slate-700 text-xs mt-0.5 break-all">
                  {docDetail.fileName}
                </dd>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <dt className="text-xs font-medium text-slate-500">Size</dt>
                  <dd className="font-medium mt-0.5">{docDetail.fileSizeKb} KB</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-slate-500">Uploaded</dt>
                  <dd className="font-medium mt-0.5">
                    {new Date(docDetail.uploadedAt).toLocaleDateString('en-IN')}
                  </dd>
                </div>
              </div>
            </dl>
            <div className="flex gap-2">
              <a
                href={`/api/documents/download/${docDetail.ipfsCid}`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 inline-flex justify-center items-center gap-1.5 bg-apcrda-primary text-white text-sm font-bold py-2.5 rounded-xl shadow-sm"
              >
                <Download className="h-4 w-4" />
                Download
              </a>
              <button
                type="button"
                onClick={() => setDocDetail(null)}
                className="flex-1 border border-slate-200 text-sm font-bold py-2.5 rounded-xl hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
