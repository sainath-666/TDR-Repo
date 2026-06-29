'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const FAQ_ITEMS = [
  {
    q: 'What is TDR?',
    a: 'Transfer of Development Rights (TDR) means making available certain amount of additional built up area in lieu of the area relinquished or surrendered by the owner of the land, so that he can use extra built up area either himself or transfer it to another in need of the extra built up area for an agreed sum of money.',
  },
  {
    q: 'Development Rights Certificate (DRC), whether transferable / Inheritable?',
    a: 'If the owner of any land which is required for road widening, formation of new roads or development of parks, play grounds, civic amenities etc., those proposed in the plan shall be eligible for the award of Transferable Development Rights. Such award will entitle the owner of the land in the form of a Development Rights Certificate (DRC), which he may use for himself or transfer to any other person.',
  },
  {
    q: "What are the Rules & GO's Applicable for TDR?",
    a: 'Rule 17 of G.O Ms. No.168, Dt:7.4.2012 and as amended vide G.O Ms. No.330, Dt:28.12.2017. Offline bond migration is governed under G.O. 207 MA&UD dt. 08.08.2016.',
  },
  {
    q: 'What is use of TDR?',
    a: 'TDR allows landowners who surrender land for public purpose to receive development rights that can be used for additional built-up area or transferred to others. In the Capital Region, TDR certificates validate offline bonds issued under the Land Pooling Scheme.',
  },
] as const;

export function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="space-y-3">
      {FAQ_ITEMS.map((item, index) => {
        const isOpen = openIndex === index;
        return (
          <div
            key={item.q}
            className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card"
          >
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? null : index)}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-slate-50"
            >
              <span className="text-sm font-semibold text-slate-800">{item.q}</span>
              <ChevronDown
                className={cn(
                  'h-4 w-4 shrink-0 text-[var(--portal-purple)] transition-transform',
                  isOpen && 'rotate-180',
                )}
              />
            </button>
            {isOpen && (
              <div className="border-t border-slate-100 px-5 py-4 text-sm leading-relaxed text-slate-600">
                {item.a}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
