import { RotateCcw } from 'lucide-react';
import type { BondReturnRemark } from '@/lib/return-remark';

interface ReturnRemarkBannerProps {
  remark: BondReturnRemark;
  compact?: boolean;
}

export function ReturnRemarkBanner({ remark, compact = false }: ReturnRemarkBannerProps) {
  const byLine = remark.returnedByName
    ? `${remark.returnedByRoleLabel} (${remark.returnedByName})`
    : remark.returnedByRoleLabel;
  const dateLine = new Date(remark.returnedAt).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  if (compact) {
    return (
      <p
        className="text-[10px] leading-snug text-amber-900 bg-amber-50 border border-amber-200/80 rounded-md px-2 py-1 mt-1"
        title={remark.remarks}
      >
        <span className="font-bold">↩ Returned:</span> {remark.remarks}
      </p>
    );
  }

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 flex gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
        <RotateCcw className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-amber-900">Returned for correction</p>
        <p className="text-xs text-amber-800/80 mt-0.5">
          By {byLine} · {dateLine}
        </p>
        <p className="text-sm text-amber-950 mt-2 leading-relaxed">{remark.remarks}</p>
      </div>
    </div>
  );
}
