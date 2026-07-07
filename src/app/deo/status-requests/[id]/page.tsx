import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Download, FileText } from 'lucide-react';
import { getCurrentUser } from '@/lib/supabase/client';
import { getStatusCheckRequestById } from '@/lib/queries/status-check-requests';
import { formatStatusCheckStatus, STATUS_CHECK_BADGE_CLASSES } from '@/lib/status-check-status';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function DeoStatusRequestDetailPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect('/official-login');

  const request = await getStatusCheckRequestById(params.id);
  if (!request) notFound();

  return (
    <div className="w-full px-4 py-5 sm:px-6">
      <div className="mb-5 flex flex-wrap items-center gap-3 rounded-xl border border-slate-200/80 bg-white px-4 py-3 shadow-sm">
        <Button href="/deo/status-requests" variant="ghost" size="sm">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div className="hidden h-5 w-px bg-slate-200 sm:block" />
        <h1 className="text-lg font-bold text-apcrda-primary">{request.referenceId}</h1>
        <span
          className={cn(
            'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
            STATUS_CHECK_BADGE_CLASSES[request.status],
          )}
        >
          {formatStatusCheckStatus(request.status)}
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <Card>
          <h2 className="text-sm font-semibold text-apcrda-primary">Request details</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Reference ID</dt>
              <dd className="font-mono font-semibold text-slate-800">{request.referenceId}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">TDR Number</dt>
              <dd className="font-semibold text-slate-800">{request.tdrNumber}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Submitted</dt>
              <dd className="font-medium text-slate-800">
                {new Date(request.createdAt).toLocaleString('en-IN')}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Last updated</dt>
              <dd className="font-medium text-slate-800">
                {new Date(request.updatedAt).toLocaleString('en-IN')}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Remarks</dt>
              <dd className="mt-1 rounded-lg bg-slate-50 px-3 py-2 text-slate-800">
                {request.remarks?.trim() ? request.remarks : '—'}
              </dd>
            </div>
          </dl>
        </Card>

        <Card>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-apcrda-primary">Documents</h2>
            <span className="text-xs font-medium text-slate-500">
              {request.documents.length} file{request.documents.length === 1 ? '' : 's'}
            </span>
          </div>

          {request.documents.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">
              No documents were uploaded with this request.
            </p>
          ) : (
            <ul className="mt-4 space-y-2">
              {request.documents.map((doc) => (
                <li
                  key={doc.id}
                  className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2.5"
                >
                  <FileText className="h-4 w-4 shrink-0 text-apcrda-primary" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-800">{doc.fileName}</p>
                    <p className="text-xs text-slate-500">
                      {doc.sizeKb} KB · {doc.contentType}
                    </p>
                  </div>
                  <Link
                    href={`/api/status-check-requests/${request.id}/documents/${doc.id}/download`}
                    className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-200 transition-colors hover:bg-emerald-100"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
