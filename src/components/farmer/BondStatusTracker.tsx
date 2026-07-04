import { BondStatus } from '@prisma/client';
import { Check, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

const STEPS: { label: string; shortLabel: string; statuses: BondStatus[] }[] = [
  {
    label: 'DEO / Surveyor',
    shortLabel: 'DEO',
    statuses: [BondStatus.DRAFT, BondStatus.PENDING_L1],
  },
  {
    label: 'Dy. Tahsildar',
    shortLabel: 'Tahsildar',
    statuses: [BondStatus.PENDING_L1, BondStatus.PENDING_L2],
  },
  { label: 'SDC', shortLabel: 'SDC', statuses: [BondStatus.PENDING_L2, BondStatus.PENDING_L3] },
  {
    label: 'Director (Lands)',
    shortLabel: 'Director',
    statuses: [BondStatus.PENDING_L3, BondStatus.PENDING_L4],
  },
  {
    label: 'Commissioner',
    shortLabel: 'Commissioner',
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
      <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-100 px-3.5 py-2.5 text-xs font-semibold text-red-700 shadow-inner">
        <Circle className="h-3.5 w-3.5 fill-red-500 text-red-500 animate-pulse" />
        Application review rejected
      </div>
    );
  }

  if (status === BondStatus.REVOKED) {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-slate-100 border border-slate-200 px-3.5 py-2.5 text-xs font-semibold text-slate-600">
        Certificate revoked
      </div>
    );
  }

  if (status === BondStatus.DRAFT) {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-slate-50 border border-slate-200/60 px-3.5 py-2.5 text-xs font-semibold text-slate-500">
        <Circle className="h-3.5 w-3.5 text-slate-400" />
        Awaiting DEO / Surveyor review
      </div>
    );
  }

  const currentIndex = STEPS.findIndex((s) => s.statuses.includes(status));
  const isComplete = status === BondStatus.ACTIVE;

  return (
    <div className="w-full py-1">
      <div className="flex items-center">
        {STEPS.map((step, i) => {
          const done = i < currentIndex || (isComplete && i <= currentIndex);
          const active = i === currentIndex && !isComplete;
          const isLast = i === STEPS.length - 1;

          return (
            <div key={step.label} className={cn('flex items-center', !isLast && 'flex-1')}>
              <div className="flex flex-col items-center shrink-0">
                <div
                  className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-full border-2 transition-all duration-300 shadow-sm',
                    done && 'border-apcrda-accent bg-apcrda-accent text-white',
                    active &&
                      'border-apcrda-secondary bg-apcrda-secondary/10 text-apcrda-secondary ring-4 ring-apcrda-secondary/20 animate-pulse-soft',
                    !done && !active && 'border-slate-200 bg-white text-slate-300',
                  )}
                >
                  {done ? (
                    <Check className="h-3.5 w-3.5" strokeWidth={3} />
                  ) : (
                    <span className="text-[10px] font-extrabold">{i + 1}</span>
                  )}
                </div>
                <span
                  className={cn(
                    'mt-1.5 text-center font-bold leading-tight tracking-tight whitespace-nowrap',
                    compact ? 'text-[9px] max-w-[44px] scale-95' : 'text-[10px] max-w-[56px]',
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
                    'h-0.5 flex-1 mx-2 rounded-full transition-colors duration-300',
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
