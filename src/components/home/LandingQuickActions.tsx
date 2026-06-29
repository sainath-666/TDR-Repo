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
    <section className="border-b border-slate-200/80 bg-white shadow-sm">
      <div className="mx-auto max-w-[1140px] px-4 sm:px-6">
        <div className="grid grid-cols-2 divide-x divide-slate-100 lg:grid-cols-4">
          {ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.label}
                href={action.href}
                className="group flex items-center gap-3 px-4 py-5 transition-colors hover:bg-apcrda-portal-light/40 sm:px-5"
              >
                <div className="gradient-portal flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-sm transition-transform group-hover:scale-105">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 group-hover:text-apcrda-portal-purple">
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
