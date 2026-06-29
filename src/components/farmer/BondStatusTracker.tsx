'use client';

import { BondStatus } from '@prisma/client';
import { Check, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

const STEPS: { label: string; shortLabel: string; statuses: BondStatus[] }[] = [
  { label: 'Submitted', shortLabel: 'Sub', statuses: [BondStatus.PENDING_L1] },
  {
    label: 'L1 Tahsildar',
    shortLabel: 'L1',
    statuses: [BondStatus.PENDING_L1, BondStatus.PENDING_L2],
  },
  { label: 'L2 SDC', shortLabel: 'L2', statuses: [BondStatus.PENDING_L2, BondStatus.PENDING_L3] },
  {
    label: 'L3 Director',
    shortLabel: 'L3',
    statuses: [BondStatus.PENDING_L3, BondStatus.PENDING_L4],
  },
  {
    label: 'Certificate',
    shortLabel: 'Cert',
    statuses: [BondStatus.PENDING_L4, BondStatus.ACTIVE],
  },
];

interface Props {
  status: BondStatus;
  compact?: boolean;
}

export function BondStatusTracker({ status, compact = false }: Props) {
  if (status === BondStatus.REJECTED) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
        <Circle className="h-3.5 w-3.5 fill-red-500 text-red-500" />
        Application rejected
      </div>
    );
  }

  if (status === BondStatus.REVOKED) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-2 text-sm text-gray-600">
        Certificate revoked
      </div>
    );
  }

  if (status === BondStatus.DRAFT) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-600">
        <Circle className="h-3.5 w-3.5" />
        Draft — not yet submitted
      </div>
    );
  }

  const currentIndex = STEPS.findIndex((s) => s.statuses.includes(status));
  const isComplete = status === BondStatus.ACTIVE;

  return (
    <div className="w-full">
      <div className="flex items-center">
        {STEPS.map((step, i) => {
          const done = i < currentIndex || (isComplete && i <= currentIndex);
          const active = i === currentIndex && !isComplete;
          const isLast = i === STEPS.length - 1;

          return (
            <div key={step.label} className={cn('flex items-center', !isLast && 'flex-1')}>
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-full border-2 transition-all',
                    done && 'border-apcrda-accent bg-apcrda-accent text-white',
                    active &&
                      'border-apcrda-secondary bg-apcrda-secondary/10 text-apcrda-secondary',
                    !done && !active && 'border-slate-200 bg-white text-slate-300',
                  )}
                >
                  {done ? (
                    <Check className="h-3.5 w-3.5" strokeWidth={3} />
                  ) : (
                    <span className="text-[10px] font-bold">{i + 1}</span>
                  )}
                </div>
                <span
                  className={cn(
                    'mt-1.5 text-center font-medium leading-tight',
                    compact ? 'text-[9px] max-w-[40px]' : 'text-[10px] max-w-[52px]',
                    active
                      ? 'text-apcrda-secondary'
                      : done
                        ? 'text-apcrda-accent'
                        : 'text-slate-400',
                  )}
                >
                  {compact ? step.shortLabel : step.label}
                </span>
              </div>
              {!isLast && (
                <div
                  className={cn(
                    'h-0.5 flex-1 mx-1 rounded-full transition-colors',
                    i < currentIndex ? 'bg-apcrda-accent' : 'bg-slate-200',
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
