import Link from 'next/link';
import { FileText, ShieldCheck, BarChart3, Landmark } from 'lucide-react';
import { cn } from '@/lib/utils';

const ACTIONS = [
  {
    href: '/farmer-login',
    label: 'Apply Now',
    description: 'Submit a new TDR application',
    icon: FileText,
    gradient: 'gradient-portal',
  },
  {
    href: '/verify',
    label: 'Verify TDR',
    description: 'Check certificate authenticity',
    icon: ShieldCheck,
    gradient: 'gradient-teal',
  },
  {
    href: '/status',
    label: 'Track Status',
    description: 'View your application status',
    icon: BarChart3,
    gradient: 'gradient-amber',
  },
  {
    href: '/tdr-bank',
    label: 'TDR Bank',
    description: 'Browse TDR certificates',
    icon: Landmark,
    gradient: 'gradient-navy',
  },
] as const;

export function LandingQuickActions() {
  return (
    <section className="border-b border-purple-100/60 bg-gradient-to-r from-white via-purple-50/30 to-sky-50/40 shadow-sm">
      <div className="mx-auto max-w-[1140px] px-4 sm:px-6">
        <div className="grid grid-cols-2 divide-x divide-purple-100/50 lg:grid-cols-4">
          {ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.label}
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
