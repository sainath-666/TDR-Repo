'use client';

import type { ApprovalStep } from '@prisma/client';
import { CheckCircle2, Clock, XCircle, RotateCcw } from 'lucide-react';
import { formatRole } from '@/lib/role-labels';
import { cn } from '@/lib/utils';

interface StepWithOfficial extends ApprovalStep {
  official?: { name: string } | null;
}

function StepIcon({ decision }: { decision: ApprovalStep['decision'] }) {
  if (decision === 'APPROVED') return <CheckCircle2 className="h-3.5 w-3.5" />;
  if (decision === 'REJECTED') return <XCircle className="h-3.5 w-3.5" />;
  if (decision === 'RETURNED') return <RotateCcw className="h-3.5 w-3.5" />;
  return <Clock className="h-3.5 w-3.5" />;
}

export function ApprovalTrailPipeline({ steps }: { steps: StepWithOfficial[] }) {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-gradient-to-r from-slate-50 to-white px-4 py-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">
        Approval pipeline
      </p>
      <div className="flex items-start gap-0 overflow-x-auto pb-1">
        {steps.map((step, index) => {
          const isApproved = step.decision === 'APPROVED';
          const isRejected = step.decision === 'REJECTED';
          const isReturned = step.decision === 'RETURNED';
          const isPending = step.decision === 'PENDING';

          return (
            <div key={step.id} className="flex items-center shrink-0">
              <div
                className={cn(
                  'flex flex-col items-center text-center w-[108px]',
                  isPending && 'opacity-90',
                )}
              >
                <div
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full border-2',
                    isApproved && 'border-emerald-500 bg-emerald-500 text-white',
                    isRejected && 'border-red-500 bg-red-500 text-white',
                    isReturned && 'border-amber-500 bg-amber-500 text-white',
                    isPending && 'border-slate-300 bg-white text-slate-400',
                  )}
                >
                  <StepIcon decision={step.decision} />
                </div>
                <p className="mt-1.5 text-[10px] font-bold text-slate-700 leading-tight line-clamp-2 px-0.5">
                  {formatRole(step.role)}
                </p>
                <span
                  className={cn(
                    'mt-0.5 text-[9px] font-semibold px-1.5 py-px rounded-full',
                    isApproved && 'bg-emerald-100 text-emerald-700',
                    isRejected && 'bg-red-100 text-red-700',
                    isReturned && 'bg-amber-100 text-amber-700',
                    isPending && 'bg-slate-100 text-slate-500',
                  )}
                >
                  {isPending
                    ? 'Pending'
                    : step.decision.charAt(0) + step.decision.slice(1).toLowerCase()}
                </span>
                {(isReturned || isRejected) && step.remarks?.trim() && (
                  <p
                    className="mt-1.5 text-[9px] text-slate-600 leading-tight line-clamp-3 px-0.5 text-left w-full"
                    title={step.remarks}
                  >
                    &ldquo;{step.remarks.trim()}&rdquo;
                  </p>
                )}
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'h-0.5 w-6 sm:w-10 shrink-0 mx-1 rounded-full',
                    isApproved ? 'bg-emerald-300' : 'bg-slate-200',
                  )}
                  aria-hidden
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export const ApprovalTrailCompact = ApprovalTrailPipeline;
