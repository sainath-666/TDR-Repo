import Link from 'next/link';
import { FileText, ShieldCheck, BarChart3, Landmark } from 'lucide-react';

const ACTIONS = [
  {
    href: '/farmer-login',
    label: 'Apply Now',
    description: 'Submit a new TDR application',
    icon: FileText,
  },
  {
    href: '/verify',
    label: 'Verify TDR',
    description: 'Check certificate authenticity',
    icon: ShieldCheck,
  },
  {
    href: '/status',
    label: 'Track Status',
    description: 'View your application status',
    icon: BarChart3,
  },
  {
    href: '/tdr-bank',
    label: 'TDR Bank',
    description: 'Browse TDR certificates',
    icon: Landmark,
  },
] as const;

export function LandingQuickActions() {
  return (
    <section className="border-b border-slate-200 bg-white shadow-sm">
      <div className="max-w-[1140px] mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-slate-100">
          {ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.label}
                href={action.href}
                className="group flex items-center gap-3 px-4 py-5 transition-colors hover:bg-slate-50 sm:px-5"
              >
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white transition-transform group-hover:scale-105"
                  style={{ backgroundColor: 'var(--portal-purple)' }}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900 group-hover:text-[var(--portal-purple)]">
                    {action.label}
                  </p>
                  <p className="hidden text-xs text-slate-500 sm:block">{action.description}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
