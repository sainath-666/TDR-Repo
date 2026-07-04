'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowDown, ArrowRight, ArrowUp, ChevronsUpDown, Eye } from 'lucide-react';
import { BondStatus } from '@prisma/client';
import type { DashboardBondRow } from '@/lib/queries/official-dashboard';
import { ReturnRemarkBanner } from '@/components/approval/ReturnRemarkBanner';
import { Badge } from '@/components/ui/Badge';
import { BOND_STATUS_LABELS } from '@/lib/bond-status';
import { cn } from '@/lib/utils';

type SortKey =
  | 'tdrNumber'
  | 'holderName'
  | 'surveyNumber'
  | 'surrenderedAreaSqYds'
  | 'status'
  | 'updatedAt';

interface BondRecordsTableProps {
  bonds: DashboardBondRow[];
  isDeo: boolean;
  reviewQueueStatus?: BondStatus | null;
}

/** Fixed column template — holder/status flex; numeric cols fixed width */
const ROW_GRID =
  'grid grid-cols-[minmax(6.5rem,0.85fr)_minmax(8rem,2fr)_4.5rem_5rem_minmax(9.5rem,1.35fr)_minmax(5.5rem,6.25rem)] gap-x-4';

function reviewPath(bondId: string, isDeo: boolean): string {
  return isDeo ? `/deo/bonds/${bondId}/review` : `/official/bonds/${bondId}/review`;
}

/** Bonds at this role's approval queue status (Review action). */
function isAwaitingReview(
  status: BondStatus,
  isDeo: boolean,
  reviewQueueStatus?: BondStatus | null,
): boolean {
  if (isDeo) return status === BondStatus.DRAFT;
  if (reviewQueueStatus) return status === reviewQueueStatus;
  return false;
}

function compareValues(a: DashboardBondRow, b: DashboardBondRow, key: SortKey): number {
  switch (key) {
    case 'tdrNumber':
      return a.tdrNumber.localeCompare(b.tdrNumber, undefined, { numeric: true });
    case 'holderName':
      return (a.holderName ?? '').localeCompare(b.holderName ?? '', 'en-IN');
    case 'surveyNumber':
      return (a.surveyNumber ?? '').localeCompare(b.surveyNumber ?? '', undefined, {
        numeric: true,
      });
    case 'surrenderedAreaSqYds':
      return (a.surrenderedAreaSqYds ?? -1) - (b.surrenderedAreaSqYds ?? -1);
    case 'status':
      return BOND_STATUS_LABELS[a.status].localeCompare(BOND_STATUS_LABELS[b.status]);
    case 'updatedAt':
      return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
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

export function BondRecordsTable({ bonds, isDeo, reviewQueueStatus }: BondRecordsTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('tdrNumber');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'tdrNumber' || key === 'updatedAt' ? 'desc' : 'asc');
    }
  }

  const sortedBonds = useMemo(() => {
    const copy = [...bonds];
    copy.sort((a, b) => {
      // Bonds awaiting this person's review always float to the top
      const aReview = isAwaitingReview(a.status, isDeo, reviewQueueStatus) ? 0 : 1;
      const bReview = isAwaitingReview(b.status, isDeo, reviewQueueStatus) ? 0 : 1;
      if (aReview !== bReview) return aReview - bReview;

      const cmp = compareValues(a, b, sortKey);
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return copy;
  }, [bonds, sortKey, sortDir, isDeo, reviewQueueStatus]);

  function canReview(status: BondStatus): boolean {
    return isAwaitingReview(status, isDeo, reviewQueueStatus);
  }

  return (
    <div className="bond-records-table min-w-[640px]" role="table">
      {/* Header */}
      <div
        className={cn(
          ROW_GRID,
          'sticky top-0 z-10 items-center border-b border-stone-200 bg-gradient-to-b from-stone-100 to-stone-50 px-4 py-2.5 shadow-sm',
        )}
        role="row"
      >
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
            label="Holder"
            sortKey="holderName"
            activeKey={sortKey}
            direction={sortDir}
            onSort={handleSort}
          />
        </div>
        <div role="columnheader" className="text-left">
          <SortableHeader
            label="Survey"
            sortKey="surveyNumber"
            activeKey={sortKey}
            direction={sortDir}
            onSort={handleSort}
          />
        </div>
        <div role="columnheader" className="text-right">
          <SortableHeader
            label="Sq Yds"
            sortKey="surrenderedAreaSqYds"
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

      {/* Body */}
      <div role="rowgroup">
        {sortedBonds.map((bond, index) => (
          <div
            key={bond.id}
            role="row"
            className={cn(
              ROW_GRID,
              'items-center border-b border-stone-100 px-4 py-2.5 text-xs transition-colors hover:bg-emerald-50/30',
              index % 2 === 0 ? 'bg-white' : 'bg-stone-50/50',
            )}
          >
            <div role="cell" className="font-semibold text-emerald-900 truncate">
              {bond.tdrNumber}
            </div>
            <div
              role="cell"
              className="truncate text-stone-800"
              title={bond.holderName ?? undefined}
            >
              {bond.holderName ?? '—'}
            </div>
            <div role="cell" className="font-mono text-[11px] text-stone-600 truncate">
              {bond.surveyNumber ?? '—'}
            </div>
            <div role="cell" className="text-right tabular-nums font-medium text-stone-800">
              {bond.surrenderedAreaSqYds != null
                ? bond.surrenderedAreaSqYds.toLocaleString('en-IN')
                : '—'}
            </div>
            <div role="cell" className="min-w-0">
              <Badge status={bond.status} />
              {bond.returnRemark && <ReturnRemarkBanner remark={bond.returnRemark} compact />}
            </div>
            <div role="cell" className="flex justify-end">
              {canReview(bond.status) ? (
                <Link
                  href={reviewPath(bond.id, isDeo)}
                  title="Review this bond"
                  className="inline-flex items-center gap-0.5 whitespace-nowrap rounded-lg bg-emerald-600/10 px-2 py-1 text-[11px] font-semibold text-emerald-800 ring-1 ring-emerald-600/20 transition-colors hover:bg-emerald-600/15"
                >
                  Review
                  <ArrowRight className="h-3 w-3 shrink-0" />
                </Link>
              ) : (
                <div className="flex flex-col items-end gap-0.5">
                  <Link
                    href={reviewPath(bond.id, isDeo)}
                    title="View bond details"
                    className="inline-flex items-center gap-1 whitespace-nowrap rounded-lg bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-800 ring-1 ring-indigo-200 transition-colors hover:bg-indigo-100"
                  >
                    <Eye className="h-3 w-3 shrink-0" />
                    View
                  </Link>
                  <span className="text-[10px] tabular-nums text-stone-400">
                    {new Date(bond.updatedAt).toLocaleDateString('en-IN')}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
