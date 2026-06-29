'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { FaqItem } from '@/lib/faq-content';

export function InstructionsFaq({ items }: { items: FaqItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="relative mx-auto max-w-3xl">
      <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-[var(--portal-blue)]/30 sm:left-6" />
      <div className="space-y-2">
        {items.map((item, index) => {
          const isOpen = openIndex === index;
          return (
            <div key={item.question} className="relative pl-10 sm:pl-14">
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : index)}
                className="absolute left-2.5 top-4 z-10 flex h-4 w-4 items-center justify-center rounded-full border-2 border-[var(--portal-blue)] bg-white sm:left-5"
                aria-expanded={isOpen}
                aria-label={item.question}
              >
                <span
                  className={cn(
                    'h-2 w-2 rounded-full transition-colors',
                    isOpen ? 'bg-[var(--portal-blue)]' : 'bg-transparent',
                  )}
                />
              </button>
              <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-card">
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="w-full px-5 py-4 text-left text-sm font-semibold text-slate-800 hover:bg-slate-50"
                >
                  {item.question}
                </button>
                {isOpen && (
                  <div className="border-t border-slate-100 px-5 py-4 text-sm leading-relaxed text-slate-600">
                    {item.answer}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
