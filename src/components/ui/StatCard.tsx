import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from './Card';

type StatAccent = 'primary' | 'amber' | 'green' | 'red' | 'blue' | 'purple';

interface StatCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  accent?: StatAccent;
  trend?: string;
  className?: string;
  compact?: boolean;
}

const accentClasses: Record<StatAccent, { bg: string; icon: string; ring: string }> = {
  primary: {
    bg: 'bg-indigo-50',
    icon: 'text-indigo-700',
    ring: 'ring-indigo-200',
  },
  amber: { bg: 'bg-amber-50', icon: 'text-amber-600', ring: 'ring-amber-100' },
  green: { bg: 'bg-emerald-50', icon: 'text-emerald-600', ring: 'ring-emerald-100' },
  red: { bg: 'bg-red-50', icon: 'text-red-600', ring: 'ring-red-100' },
  blue: { bg: 'bg-blue-50', icon: 'text-blue-600', ring: 'ring-blue-100' },
  purple: { bg: 'bg-purple-50', icon: 'text-purple-700', ring: 'ring-purple-100' },
};

export function StatCard({
  label,
  value,
  icon: Icon,
  accent = 'primary',
  trend,
  className,
  compact = false,
}: StatCardProps) {
  const colors = accentClasses[accent];

  if (compact) {
    return (
      <Card padding="xs" className={cn(className)} hover>
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-[11px] font-medium text-slate-600">{label}</p>
            <p className="text-xl font-bold tabular-nums tracking-tight text-slate-900">{value}</p>
            {trend && <p className="truncate text-[10px] text-slate-400">{trend}</p>}
          </div>
          <div
            className={cn(
              'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-1',
              colors.bg,
              colors.icon,
              colors.ring,
            )}
          >
            <Icon className="h-3.5 w-3.5" strokeWidth={2.25} />
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn('animate-slide-up', className)} hover>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-1 text-3xl font-bold tracking-tight text-slate-900 tabular-nums">
            {value}
          </p>
          {trend && <p className="mt-1 text-xs text-slate-400">{trend}</p>}
        </div>
        <div
          className={cn(
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1',
            colors.bg,
            colors.icon,
            colors.ring,
          )}
        >
          <Icon className="h-5 w-5" strokeWidth={2} />
        </div>
      </div>
    </Card>
  );
}
