'use client';

import Link from 'next/link';
import { FileText, ShieldCheck, BarChart3, Landmark } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLocale } from '@/lib/i18n/locale-context';

const ACTIONS = [
  {
    href: '/farmer-login',
    labelKey: 'applyNow' as const,
    descKey: 'applyNowDesc' as const,
    icon: FileText,
    gradient: 'gradient-portal',
  },
  {
    href: '/verify',
    labelKey: 'verifyTdr' as const,
    descKey: 'verifyTdrDesc' as const,
    icon: ShieldCheck,
    gradient: 'gradient-teal',
  },
  {
    href: '/status',
    labelKey: 'trackStatus' as const,
    descKey: 'trackStatusDesc' as const,
    icon: BarChart3,
    gradient: 'gradient-amber',
  },
  {
    href: '/tdr-bank',
    labelKey: 'tdrBank' as const,
    descKey: 'tdrBankDesc' as const,
    icon: Landmark,
    gradient: 'gradient-navy',
  },
] as const;

export function LandingQuickActions() {
  const { t } = useLocale();

  return (
    <section className="border-b border-purple-100/60 bg-gradient-to-r from-white via-purple-50/30 to-sky-50/40 shadow-sm">
      <div className="mx-auto max-w-[1140px] px-4 sm:px-6">
        <div className="grid grid-cols-2 divide-x divide-purple-100/50 lg:grid-cols-4">
          {ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.labelKey}
                href={action.href}
                className="group flex items-center gap-3 px-4 py-5 transition-all hover:bg-white/80 sm:px-5"
              >
                <div
                  className={cn(
                    'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-md transition-transform group-hover:scale-105 group-hover:shadow-glow',
                    action.gradient,
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 group-hover:text-apcrda-portal-purple">
                    {t.quickActions[action.labelKey]}
                  </p>
                  <p className="hidden text-xs text-slate-500 sm:block">
                    {t.quickActions[action.descKey]}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
