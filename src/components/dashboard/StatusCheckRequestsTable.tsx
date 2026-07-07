'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowDown, ArrowUp, ChevronsUpDown, Eye } from 'lucide-react';
import { TdrStatusCheckRequestStatus } from '@prisma/client';
import type { StatusCheckRequestRow } from '@/lib/queries/status-check-requests';
import { formatStatusCheckStatus, STATUS_CHECK_BADGE_CLASSES } from '@/lib/status-check-status';
import { cn } from '@/lib/utils';

type SortKey = 'referenceId' | 'tdrNumber' | 'remarks' | 'documentCount' | 'status' | 'createdAt';

const ROW_GRID =
  'grid grid-cols-[minmax(6.5rem,1fr)_minmax(6.5rem,0.9fr)_minmax(8rem,1.5fr)_4rem_minmax(6.5rem,0.85fr)_minmax(5.5rem,6.25rem)] gap-x-4';

function compareValues(a: StatusCheckRequestRow, b: StatusCheckRequestRow, key: SortKey): number {
  switch (key) {
    case 'referenceId':
      return a.referenceId.localeCompare(b.referenceId, undefined, { numeric: true });
    case 'tdrNumber':
      return a.tdrNumber.localeCompare(b.tdrNumber, undefined, { numeric: true });
    case 'remarks':
      return (a.remarks ?? '').localeCompare(b.remarks ?? '', 'en-IN');
    case 'documentCount':
      return a.documentCount - b.documentCount;
    case 'status':
      return formatStatusCheckStatus(a.status).localeCompare(formatStatusCheckStatus(b.status));
    case 'createdAt':
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    default:
      return 0;
  }
}

function SortableHeader({
  label,
  sortKey,
  activeKey,
  direction,
  onSort,
  align = 'left',
}: {
  label: string;
  sortKey: SortKey;
  activeKey: SortKey;
  direction: 'asc' | 'desc';
  onSort: (key: SortKey) => void;
  align?: 'left' | 'right';
}) {
  const isActive = activeKey === sortKey;
  const Icon = isActive ? (direction === 'asc' ? ArrowUp : ArrowDown) : ChevronsUpDown;

  return (
    <button
      type="button"
      onClick={() => onSort(sortKey)}
      className={cn(
        'inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider transition-colors',
        align === 'right' && 'ml-auto',
        isActive ? 'text-emerald-800' : 'text-stone-600 hover:text-stone-900',
      )}
    >
      {label}
      <Icon className={cn('h-3.5 w-3.5 shrink-0', isActive ? 'opacity-100' : 'opacity-40')} />
    </button>
  );
}

function StatusBadge({ status }: { status: TdrStatusCheckRequestStatus }) {
  return (
    <span
      className={cn(
        'inline-flex max-w-full items-center truncate rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
        STATUS_CHECK_BADGE_CLASSES[status],
      )}
    >
      {formatStatusCheckStatus(status)}
    </span>
  );
}

export function StatusCheckRequestsTable({ requests }: { requests: StatusCheckRequestRow[] }) {
  const [sortKey, setSortKey] = useState<SortKey>('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'createdAt' || key === 'referenceId' ? 'desc' : 'asc');
    }
  }

  const sortedRequests = useMemo(() => {
    const copy = [...requests];
    copy.sort((a, b) => {
      const aPending = a.status === TdrStatusCheckRequestStatus.PENDING ? 0 : 1;
      const bPending = b.status === TdrStatusCheckRequestStatus.PENDING ? 0 : 1;
      if (aPending !== bPending) return aPending - bPending;

      const cmp = compareValues(a, b, sortKey);
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return copy;
  }, [requests, sortKey, sortDir]);

  return (
    <div className="status-check-table min-w-[720px]" role="table">
      <div
        className={cn(
          ROW_GRID,
          'sticky top-0 z-10 items-center border-b border-stone-200 bg-gradient-to-b from-stone-100 to-stone-50 px-4 py-2.5 shadow-sm',
        )}
        role="row"
      >
        <div role="columnheader" className="text-left">
          <SortableHeader
            label="Reference"
            sortKey="referenceId"
            activeKey={sortKey}
            direction={sortDir}
            onSort={handleSort}
          />
        </div>
        <div role="columnheader" className="text-left">
          <SortableHeader
            label="TDR No."
            sortKey="tdrNumber"
            activeKey={sortKey}
            direction={sortDir}
            onSort={handleSort}
          />
        </div>
        <div role="columnheader" className="text-left">
          <SortableHeader
            label="Remarks"
            sortKey="remarks"
            activeKey={sortKey}
            direction={sortDir}
            onSort={handleSort}
          />
        </div>
        <div role="columnheader" className="text-right">
          <SortableHeader
            label="Docs"
            sortKey="documentCount"
            activeKey={sortKey}
            direction={sortDir}
            onSort={handleSort}
            align="right"
          />
        </div>
        <div role="columnheader" className="text-left">
          <SortableHeader
            label="Status"
            sortKey="status"
            activeKey={sortKey}
            direction={sortDir}
            onSort={handleSort}
          />
        </div>
        <div
          role="columnheader"
          className="text-right text-[10px] font-semibold uppercase tracking-wider text-stone-600"
        >
          Action
        </div>
      </div>

      <div role="rowgroup">
        {sortedRequests.map((request, index) => (
          <div
            key={request.id}
            role="row"
            className={cn(
              ROW_GRID,
              'items-center border-b border-stone-100 px-4 py-2.5 text-xs transition-colors hover:bg-emerald-50/30',
              index % 2 === 0 ? 'bg-white' : 'bg-stone-50/50',
            )}
          >
            <div role="cell" className="font-mono font-semibold text-emerald-900 truncate">
              {request.referenceId}
            </div>
            <div role="cell" className="font-semibold text-stone-800 truncate">
              {request.tdrNumber}
            </div>
            <div
              role="cell"
              className="truncate text-stone-600"
              title={request.remarks ?? undefined}
            >
              {request.remarks ?? '—'}
            </div>
            <div role="cell" className="text-right tabular-nums font-medium text-stone-800">
              {request.documentCount}
            </div>
            <div role="cell" className="min-w-0">
              <StatusBadge status={request.status} />
            </div>
            <div role="cell" className="flex justify-end">
              <div className="flex flex-col items-end gap-0.5">
                <Link
                  href={`/deo/status-requests/${request.id}`}
                  prefetch
                  title="View request details"
                  className="inline-flex items-center gap-1 whitespace-nowrap rounded-lg bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-800 ring-1 ring-indigo-200 transition-colors hover:bg-indigo-100"
                >
                  <Eye className="h-3 w-3 shrink-0" />
                  View
                </Link>
                <span className="text-[10px] tabular-nums text-stone-400">
                  {new Date(request.createdAt).toLocaleDateString('en-IN')}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
