'use client';

import { BondStatus } from '@prisma/client';

const STEPS: { label: string; statuses: BondStatus[] }[] = [
  { label: 'Submitted', statuses: [BondStatus.PENDING_L1] },
  { label: 'L1 Review', statuses: [BondStatus.PENDING_L1, BondStatus.PENDING_L2] },
  { label: 'L2 SDC', statuses: [BondStatus.PENDING_L2, BondStatus.PENDING_L3] },
  { label: 'L3 Director', statuses: [BondStatus.PENDING_L3, BondStatus.PENDING_L4] },
  { label: 'Certificate', statuses: [BondStatus.PENDING_L4, BondStatus.ACTIVE] },
];

interface Props {
  status: BondStatus;
}

export function BondStatusTracker({ status }: Props) {
  const currentIndex = STEPS.findIndex((s) => s.statuses.includes(status));

  return (
    <div className="flex justify-between items-center">
      {STEPS.map((step, i) => (
        <div key={step.label} className="flex flex-col items-center flex-1">
          <div
            className={`w-3 h-3 rounded-full ${
              i <= currentIndex ? 'bg-apcrda-accent' : 'bg-slate-200'
            }`}
          />
          <span className="text-[10px] text-slate-500 mt-1 text-center">{step.label}</span>
        </div>
      ))}
    </div>
  );
}
