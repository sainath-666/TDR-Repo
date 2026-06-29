'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { TdrBondWithRelations } from '@/types';
import type { UserRole } from '@/types';

interface Props {
  bond: TdrBondWithRelations;
  userRole: UserRole;
}

export function BondReviewPanel({ bond, userRole }: Props) {
  const router = useRouter();
  const [otp, setOtp] = useState('');
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [action, setAction] = useState<'approve' | 'reject' | 'return' | null>(null);
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function requestOtp() {
    await fetch('/api/auth/approval-otp/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ purpose: 'APPROVAL' }),
    });
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
          : { otp, remarks: type === 'reject' ? remarks.trim() : undefined };

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
      router.push('/official/queue');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Action failed');
    } finally {
      setLoading(false);
      setShowOtpModal(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold">{bond.tdrNumber}</h1>
          <span className="text-sm bg-slate-100 px-2 py-1 rounded">{bond.status}</span>
        </div>
      </div>

      {error && <p className="text-red-600 bg-red-50 p-3 rounded">{error}</p>}

      <div className="bg-white border rounded-lg p-4">
        <h2 className="font-semibold mb-2">Holder Details</h2>
        <p>Name: {bond.holder?.name}</p>
        <p>Aadhaar: XXXX-XXXX-{bond.holder?.aadhaarHash.slice(-4)}</p>
        <p>Phone: ****{bond.holder?.aadhaarPhone.slice(-4)}</p>
      </div>

      {bond.landDetails && (
        <div className="bg-white border rounded-lg p-4">
          <h2 className="font-semibold mb-2">Land Details</h2>
          <p>Survey: {bond.landDetails.surveyNumber}</p>
          <p>Village: {bond.landDetails.surrenderedVillage}</p>
          <p>Area: {Number(bond.landDetails.surrenderedAreaSqYds)} Sq Yards</p>
          <p>TDR Extent: {Number(bond.landDetails.tdrIssuedExtentSqYds)} Sq Yards</p>
          <p>Ratio: {bond.landDetails.issuedRatio}</p>
        </div>
      )}

      <div className="bg-white border rounded-lg p-4">
        <h2 className="font-semibold mb-2">Documents ({bond.documents.length}/5)</h2>
        {bond.documents.map((doc) => (
          <p key={doc.id} className="text-sm">
            {doc.docType}: {doc.fileName}
          </p>
        ))}
      </div>

      <div className="bg-white border rounded-lg p-4">
        <h2 className="font-semibold mb-2">Approval History</h2>
        {bond.approvalSteps.map((step) => (
          <div key={step.id} className="text-sm border-b py-2">
            L{step.level} ({step.role}): {step.decision}
            {step.cerbosCallId && (
              <span className="text-slate-400 ml-2">cerbos:{step.cerbosCallId.slice(0, 8)}</span>
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => {
            setAction('approve');
            setShowOtpModal(true);
            void requestOtp();
          }}
          className="bg-green-600 text-white px-4 py-2 rounded-lg"
        >
          Approve
        </button>
        <button
          onClick={() => {
            setAction('reject');
            setShowOtpModal(true);
            void requestOtp();
          }}
          className="bg-red-600 text-white px-4 py-2 rounded-lg"
        >
          Reject
        </button>
        <button
          onClick={() => {
            setAction('return');
            setRemarks('');
            setShowOtpModal(true);
          }}
          disabled={loading}
          className="bg-amber-500 text-white px-4 py-2 rounded-lg"
        >
          Return to DEO
        </button>
      </div>

      {showOtpModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full space-y-4">
            <h3 className="font-semibold">
              {action === 'approve'
                ? 'Confirm Approval'
                : action === 'reject'
                  ? 'Confirm Rejection'
                  : 'Return to DEO'}
            </h3>
            {(action === 'reject' || action === 'return') && (
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder={
                  action === 'return'
                    ? 'Return reason (min 10 characters)'
                    : 'Rejection reason (min 10 chars)'
                }
                className="w-full border rounded p-2 text-sm"
                rows={3}
              />
            )}
            {action !== 'return' && (
              <input
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                maxLength={6}
                placeholder="Enter 6-digit OTP"
                className="w-full border rounded p-2 text-center text-xl tracking-widest"
              />
            )}
            <div className="flex gap-2">
              <button
                onClick={() => action && handleAction(action)}
                disabled={
                  loading ||
                  (action === 'return'
                    ? remarks.trim().length < 10
                    : action === 'reject'
                      ? remarks.trim().length < 10 || otp.length !== 6
                      : otp.length !== 6)
                }
                className="flex-1 bg-apcrda-primary text-white py-2 rounded disabled:opacity-50"
              >
                Confirm
              </button>
              <button onClick={() => setShowOtpModal(false)} className="flex-1 border py-2 rounded">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
