'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { TdrBondWithRelations } from '@/types';
import type { UserRole } from '@/types';
import { 
  User, 
  MapPin, 
  Compass, 
  Ruler, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  Undo2, 
  History, 
  ExternalLink, 
  Download, 
  Loader2,
  Lock
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatRole } from '@/lib/role-labels';
import type { BondDocument } from '@prisma/client';

const DOC_LABELS = {
  OWNERSHIP_DOCUMENT: { en: 'Ownership Document', te: 'యాజమాన్య పత్రం' },
  AADHAAR_COPY: { en: 'Aadhaar Copy', te: 'ఆధార్ కాపీ' },
  RETURNABLE_PLOT_ALLOTMENT: { en: 'Returnable Plot Allotment', te: 'తిరిగి ఇచ్చే ప్లాట్ కేటాయింపు' },
  TDR_ISSUED_COPY: { en: 'TDR Issued Copy', te: 'TDR జారీ కాపీ' },
  INDIVIDUAL_SKETCH: { en: 'Individual Sketch', te: 'వ్యక్తిగత స్కెచ్' },
};

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
  const [docDetail, setDocDetail] = useState<BondDocument | null>(null);

  async function requestOtp() {
    try {
      await fetch('/api/auth/approval-otp/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ purpose: 'APPROVAL' }),
      });
    } catch (e) {
      console.error('Failed to request OTP:', e);
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
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left Main Details Column */}
      <div className="lg:col-span-8 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 p-4 rounded-2xl flex items-start gap-3">
            <XCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-red-800 text-sm">Action Failed</h4>
              <p className="text-red-700 text-xs mt-0.5 leading-relaxed">{error}</p>
            </div>
          </div>
        )}

        {/* Card 1: Holder Details */}
        <Card padding="md" className="space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-10 after:bg-apcrda-secondary">
            <User className="h-5 w-5 text-apcrda-primary" />
            <h3 className="font-bold text-slate-800 text-sm tracking-wide uppercase">
              Holder Information
            </h3>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 text-sm">
            <div>
              <span className="text-[10px] font-semibold text-slate-400 block uppercase tracking-wider">
                Full Name
              </span>
              <span className="font-bold text-slate-800 block mt-0.5">{bond.holder?.name}</span>
            </div>
            
            <div>
              <span className="text-[10px] font-semibold text-slate-400 block uppercase tracking-wider">
                Relationship
              </span>
              <span className="font-semibold text-slate-800 block mt-0.5">
                {bond.holder ? `${bond.holder.relationType} ${bond.holder.relationName}` : '—'}
              </span>
            </div>

            <div>
              <span className="text-[10px] font-semibold text-slate-400 block uppercase tracking-wider">
                Aadhaar Number
              </span>
              <span className="font-mono text-slate-800 block mt-0.5">
                XXXX-XXXX-{bond.holder?.aadhaarHash.slice(-4)}
              </span>
            </div>

            <div>
              <span className="text-[10px] font-semibold text-slate-400 block uppercase tracking-wider">
                Phone Number
              </span>
              <span className="font-semibold text-slate-800 block mt-0.5">
                ****{bond.holder?.aadhaarPhone.slice(-4)}
              </span>
            </div>

            <div>
              <span className="text-[10px] font-semibold text-slate-400 block uppercase tracking-wider">
                Email Address
              </span>
              <span className="font-semibold text-slate-800 block mt-0.5">{bond.holder?.email ?? '—'}</span>
            </div>

            <div>
              <span className="text-[10px] font-semibold text-slate-400 block uppercase tracking-wider">
                Village / Mandal
              </span>
              <span className="font-semibold text-slate-800 block mt-0.5">
                {bond.holder ? `${bond.holder.village}, ${bond.holder.mandal}` : '—'}
              </span>
            </div>

            <div className="sm:col-span-2 lg:col-span-3 pt-3 border-t border-slate-50">
              <span className="text-[10px] font-semibold text-slate-400 block uppercase tracking-wider">
                Complete Address Details
              </span>
              <span className="font-medium text-slate-800 block mt-1">
                {bond.holder
                  ? `${bond.holder.doorNo}, ${bond.holder.street}, ${bond.holder.village}, ${bond.holder.mandal}, ${bond.holder.district} District`
                  : '—'}
              </span>
            </div>
          </div>
        </Card>

        {/* Card 2: Land Details */}
        {bond.landDetails && (
          <Card padding="md" className="space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-10 after:bg-apcrda-secondary">
              <Compass className="h-5 w-5 text-apcrda-primary" />
              <h3 className="font-bold text-slate-800 text-sm tracking-wide uppercase">
                Land details
              </h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 text-sm">
              <div>
                <span className="text-[10px] font-semibold text-slate-400 block uppercase tracking-wider">
                  Survey Number
                </span>
                <span className="font-bold font-mono text-slate-800 block mt-0.5">
                  {bond.landDetails.surveyNumber}
                </span>
              </div>
              
              <div>
                <span className="text-[10px] font-semibold text-slate-400 block uppercase tracking-wider">
                  Surrendered Village
                </span>
                <span className="font-bold text-slate-800 block mt-0.5">
                  {bond.landDetails.surrenderedVillage}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-semibold text-slate-400 block uppercase tracking-wider">
                  Ownership Deed No
                </span>
                <span className="font-bold font-mono text-slate-800 block mt-0.5">
                  {bond.landDetails.ownershipDeedNo ?? '—'}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-semibold text-slate-400 block uppercase tracking-wider">
                  Surrendered Area
                </span>
                <span className="font-extrabold text-slate-800 block mt-0.5 tabular-nums">
                  {Number(bond.landDetails.surrenderedAreaSqYds).toLocaleString('en-IN')} Sq Yards
                </span>
              </div>

              <div>
                <span className="text-[10px] font-semibold text-slate-400 block uppercase tracking-wider">
                  TDR Issued Extent
                </span>
                <span className="font-extrabold text-slate-800 block mt-0.5 tabular-nums">
                  {Number(bond.landDetails.tdrIssuedExtentSqYds).toLocaleString('en-IN')} Sq Yards
                </span>
              </div>

              <div>
                <span className="text-[10px] font-semibold text-slate-400 block uppercase tracking-wider">
                  Issued Ratio
                </span>
                <span className="font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-lg border border-amber-200/50 inline-block mt-0.5 font-mono text-xs">
                  {bond.landDetails.issuedRatio}
                </span>
              </div>
            </div>
          </Card>
        )}

        {/* Card 3: Documents Card */}
        <Card padding="md" className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-10 after:bg-apcrda-secondary">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-apcrda-primary" />
              <h3 className="font-bold text-slate-800 text-sm tracking-wide uppercase">
                Uploaded Documents
              </h3>
            </div>
            <span className="text-[10px] font-extrabold text-apcrda-primary bg-indigo-50 border border-indigo-100/50 px-2.5 py-1 rounded-full">
              {bond.documents.length} / 5 Attached
            </span>
          </div>

          {bond.documents.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">No documents uploaded.</p>
          ) : (
            <div className="overflow-hidden border border-slate-100 rounded-xl">
              <table className="min-w-full divide-y divide-slate-100 text-xs">
                <thead className="bg-slate-50/60 font-semibold text-slate-700">
                  <tr>
                    <th className="px-4 py-3 text-left">Document Type</th>
                    <th className="px-4 py-3 text-left">Filename</th>
                    <th className="px-4 py-3 text-left">IPFS CID</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white text-slate-600 font-medium">
                  {bond.documents.map((doc) => {
                    const labelEn = DOC_LABELS[doc.docType]?.en ?? doc.docType;
                    const labelTe = DOC_LABELS[doc.docType]?.te ?? '';
                    return (
                      <tr key={doc.id} className="hover:bg-slate-50/30 transition-colors">
                        <td className="px-4 py-3.5">
                          <span className="font-bold text-slate-800 block">{labelEn}</span>
                          {labelTe && <span className="text-[10px] text-slate-400 font-telugu block mt-0.5">{labelTe}</span>}
                        </td>
                        <td className="px-4 py-3.5 max-w-[140px] truncate">{doc.fileName}</td>
                        <td className="px-4 py-3.5 font-mono text-[10px] text-indigo-600 select-all">{doc.ipfsCid}</td>
                        <td className="px-4 py-3.5 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => setDocDetail(doc)}
                            className="inline-flex items-center gap-1.5 text-apcrda-accent hover:text-apcrda-accent-light px-3 py-1.5 rounded-xl border border-apcrda-accent/20 hover:border-apcrda-accent bg-emerald-50/30 hover:bg-emerald-50/80 transition-all font-bold"
                          >
                            <ExternalLink className="h-3 w-3" />
                            View Info
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Card 4: Timeline history */}
        <Card padding="md" className="space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-10 after:bg-apcrda-secondary">
            <History className="h-5 w-5 text-apcrda-primary" />
            <h3 className="font-bold text-slate-800 text-sm tracking-wide uppercase">
              Approval Trail & History
            </h3>
          </div>
          
          <div className="relative border-l-2 border-slate-100 ml-4 pl-6 space-y-6">
            {bond.approvalSteps.map((step) => {
              const isApproved = step.decision === 'APPROVED';
              const isRejected = step.decision === 'REJECTED';
              const isReturned = step.decision === 'RETURNED';
              const isPending = step.decision === 'PENDING';
              
              const cardBgClass = isPending ? 'bg-slate-50/40 border-slate-100/80' : 'bg-white border-slate-100 shadow-sm';
              
              return (
                <div key={step.id} className="relative flex gap-4 items-start group">
                  {/* Timeline node dot */}
                  <div className={`absolute -left-[31px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full border-2 bg-white transition-all ring-4 ${
                    isApproved ? 'border-emerald-500 ring-emerald-50' : 
                    isRejected ? 'border-red-500 ring-red-50' : 
                    isReturned ? 'border-amber-500 ring-amber-50' : 
                    'border-slate-300 ring-transparent'
                  }`} />
                  
                  <div className={`flex-1 border rounded-2xl p-4 transition-all duration-300 ${cardBgClass}`}>
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                      <div>
                        <span className="text-[9px] font-extrabold text-indigo-700 bg-indigo-50 border border-indigo-100/50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                          Level {step.level}
                        </span>
                        <h4 className="font-bold text-slate-800 text-sm mt-1.5">
                          {formatRole(step.role)} Review
                        </h4>
                      </div>
                      <div>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-bold rounded-full ring-1 ring-inset ${
                          isApproved ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' :
                          isRejected ? 'bg-red-50 text-red-700 ring-red-200' :
                          isReturned ? 'bg-amber-50 text-amber-700 ring-amber-200' :
                          'bg-slate-50 text-slate-400 ring-slate-200'
                        }`}>
                          {isPending ? 'Pending Action' : step.decision.charAt(0) + step.decision.slice(1).toLowerCase()}
                        </span>
                      </div>
                    </div>

                    {!isPending && (
                      <div className="mt-3 pt-3 border-t border-slate-50 text-xs space-y-2 text-slate-500">
                        {step.official && (
                          <p>
                            <span className="font-semibold text-slate-700">Official:</span> {step.official.name}
                          </p>
                        )}
                        {step.remarks && (
                          <p className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 italic text-slate-600 font-medium">
                            &ldquo;{step.remarks}&rdquo;
                          </p>
                        )}
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-slate-400 font-medium pt-1">
                          {step.decidedAt && (
                            <p>
                              Date: {new Date(step.decidedAt).toLocaleString('en-IN')}
                            </p>
                          )}
                          {step.cerbosCallId && (
                            <p className="font-mono">
                              Cerbos ID: {step.cerbosCallId.slice(0, 12)}
                            </p>
                          )}
                          {step.signatureHash && (
                            <p className="font-mono text-[9px] truncate max-w-full">
                              Signature: {step.signatureHash.slice(0, 32)}...
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Right Column Sticky Action Panel */}
      <div className="lg:col-span-4 lg:sticky lg:top-6 space-y-6">
        <Card padding="md" className="space-y-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Current Pipeline Status
            </span>
            <h2 className="text-xl font-extrabold text-apcrda-primary mt-1">{bond.tdrNumber}</h2>
            <div className="mt-2">
              <Badge status={bond.status} size="md" />
            </div>
          </div>
          
          <div className="h-px bg-slate-100" />
          
          {/* Instructions box */}
          <div className="bg-indigo-50/50 rounded-2xl border border-indigo-100/50 p-4 space-y-2 text-xs text-slate-600 leading-relaxed">
            <p className="font-bold text-apcrda-primary uppercase tracking-wide text-[10px]">
              Review Directives
            </p>
            {userRole === 'TAHSILDAR' || userRole === 'DY_TAHSILDAR' ? (
              <p>As a **Tahsildar / Dy. Tahsildar (L1)**, verify farmer identity records, Aadhaar credentials, and communication details against physical land records.</p>
            ) : userRole === 'SDC' ? (
              <p>As a **Sub-Divisional Collector (L2)**, verify the physical GIS survey boundaries, deed numbers, and pooled areas.</p>
            ) : userRole === 'DIRECTOR_LANDS' ? (
              <p>As a **Director (L3)**, review calculating metrics, land-to-TDR conversion ratios, and regulatory compliance.</p>
            ) : userRole === 'COMMISSIONER' || userRole === 'ADDL_COMMISSIONER' ? (
              <p>As a **Commissioner / Addl. Commissioner (L4)**, you approve the allocation and initiate the blockchain minting of the TDR Certificate.</p>
            ) : (
              <p>Please inspect the credentials, land measurements, and uploads before continuing.</p>
            )}
          </div>
          
          <div className="space-y-3 pt-1">
            <button
              onClick={() => {
                setAction('approve');
                setShowOtpModal(true);
                void requestOtp();
              }}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl py-3 px-4 text-sm font-bold text-white transition-all shadow-sm hover:brightness-110 active:scale-95 bg-gradient-to-r from-emerald-600 to-emerald-500"
            >
              <CheckCircle2 className="h-4.5 w-4.5" />
              Approve Application
            </button>
            
            <button
              onClick={() => {
                setAction('reject');
                setShowOtpModal(true);
                void requestOtp();
              }}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl py-3 px-4 text-sm font-bold text-white transition-all shadow-sm hover:brightness-110 active:scale-95 bg-gradient-to-r from-rose-600 to-rose-500"
            >
              <XCircle className="h-4.5 w-4.5" />
              Reject Application
            </button>
            
            <button
              onClick={() => {
                setAction('return');
                setRemarks('');
                setShowOtpModal(true);
              }}
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl py-3 px-4 text-sm font-bold text-white transition-all shadow-sm hover:brightness-110 active:scale-95 bg-gradient-to-r from-amber-500 to-amber-400 disabled:opacity-50"
            >
              <Undo2 className="h-4.5 w-4.5" />
              Return to DEO
            </button>
          </div>
        </Card>
      </div>

      {/* OTP / Remarks Modal Overlay */}
      {showOtpModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-xl border border-slate-100 animate-slide-up">
            <div className="text-center space-y-2">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                <Lock className="h-6 w-6 text-apcrda-primary" />
              </div>
              <h3 className="font-bold text-slate-800 text-lg">
                {action === 'approve'
                  ? 'Confirm Approval'
                  : action === 'reject'
                    ? 'Confirm Rejection'
                    : 'Return to DEO'}
              </h3>
              <p className="text-xs text-slate-500 px-3">
                {action === 'return'
                  ? 'Please outline detailed reasons for returning this bond. It will revert back to draft status.'
                  : 'Enter authorization details to complete this approval pipeline step.'}
              </p>
            </div>

            {(action === 'reject' || action === 'return') && (
              <div>
                <label className="field-label text-xs">Remarks / Feedback *</label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder={
                    action === 'return'
                      ? 'Return reason (minimum 10 characters)'
                      : 'Rejection reason (minimum 10 characters)'
                  }
                  className="input-field p-3 text-xs leading-normal resize-none"
                  rows={3}
                />
                <span className="text-[10px] text-slate-400 flex justify-end mt-1">
                  {remarks.length} / 10 min chars
                </span>
              </div>
            )}

            {action !== 'return' && (
              <div className="space-y-1">
                <label className="field-label text-xs text-center block">One-Time Password *</label>
                <input
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  maxLength={6}
                  placeholder="0 0 0 0 0 0"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-center text-2xl font-extrabold tracking-widest text-slate-800 shadow-inner focus:outline-none focus:border-apcrda-primary focus:bg-white focus:ring-2 focus:ring-apcrda-primary/20 transition-all placeholder:text-slate-300"
                />
                <span className="text-[9px] text-slate-400 block text-center mt-1">
                  Sent to official-registered device.
                </span>
              </div>
            )}

            <div className="flex gap-3 pt-2">
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
                className="flex-1 inline-flex items-center justify-center rounded-xl bg-apcrda-primary hover:bg-apcrda-primary-light text-white text-xs font-bold py-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm Action'}
              </button>
              <button
                onClick={() => {
                  setShowOtpModal(false);
                  setError('');
                }}
                disabled={loading}
                className="flex-1 border text-slate-700 text-xs font-bold py-3 rounded-xl hover:bg-slate-50 transition-all border-slate-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Doc Detail Metadata Modal Overlay */}
      {docDetail && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 shadow-xl border border-slate-100 animate-slide-up">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-sm tracking-wide uppercase">
                Document Details
              </h3>
              <button
                onClick={() => setDocDetail(null)}
                className="text-slate-400 hover:text-slate-600 font-extrabold text-lg leading-none"
              >
                &times;
              </button>
            </div>
            
            <div className="space-y-3.5 text-xs text-slate-600">
              <div>
                <span className="text-[10px] font-semibold text-slate-400 block uppercase tracking-wider">
                  Document Type
                </span>
                <span className="font-bold text-slate-800 block mt-0.5">
                  {DOC_LABELS[docDetail.docType]?.en ?? docDetail.docType}
                </span>
                <span className="text-[10px] text-slate-400 font-telugu block mt-0.5">
                  {DOC_LABELS[docDetail.docType]?.te ?? ''}
                </span>
              </div>
              
              <div>
                <span className="text-[10px] font-semibold text-slate-400 block uppercase tracking-wider">
                  Filename
                </span>
                <span className="font-mono font-semibold text-slate-800 block mt-0.5 truncate select-all">
                  {docDetail.fileName}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-semibold text-slate-400 block uppercase tracking-wider">
                  IPFS CID Link
                </span>
                <span className="font-mono text-indigo-600 bg-slate-50 px-2.5 py-2 rounded-xl border border-slate-100 block select-all break-all mt-0.5">
                  {docDetail.ipfsCid}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 block uppercase tracking-wider">
                    File Size
                  </span>
                  <span className="font-semibold text-slate-800 block mt-0.5">
                    {docDetail.fileSizeKb} KB
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 block uppercase tracking-wider">
                    Uploaded Date
                  </span>
                  <span className="font-semibold text-slate-800 block mt-0.5">
                    {new Date(docDetail.uploadedAt).toLocaleDateString('en-IN')}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-semibold text-slate-400 block uppercase tracking-wider">
                  SHA-256 Hash
                </span>
                <span className="font-mono text-[10px] text-slate-500 bg-slate-50 px-2.5 py-2 rounded-xl border border-slate-100 block break-all mt-0.5">
                  {docDetail.sha256Hash}
                </span>
              </div>
            </div>
            
            <div className="flex gap-3 pt-2">
              <a
                href={`/api/documents/download/${docDetail.ipfsCid}`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 inline-flex justify-center items-center gap-1.5 bg-apcrda-primary hover:bg-apcrda-primary-light text-white text-xs font-bold py-2.5 rounded-xl transition-all text-center shadow-sm"
              >
                <Download className="h-3.5 w-3.5" />
                Download Metadata
              </a>
              <button
                onClick={() => setDocDetail(null)}
                className="flex-1 border border-slate-200 text-slate-700 text-xs font-bold py-2.5 rounded-xl hover:bg-slate-50 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
