import { BondStatus } from '@prisma/client';
import { BOND_STATUS_BADGE_CLASSES, formatBondStatus, resolveBondStatus } from '@/lib/bond-status';
import { cn } from '@/lib/utils';

interface BadgeProps {
  status?: BondStatus | string;
  label?: string;
  className?: string;
  size?: 'sm' | 'md';
}

export function Badge({ status, label, className, size = 'sm' }: BadgeProps) {
  const resolved = resolveBondStatus(status);
  const text = label ?? (resolved ? formatBondStatus(resolved) : '');
  const colorClasses = resolved
    ? BOND_STATUS_BADGE_CLASSES[resolved]
    : 'bg-slate-100 text-slate-700 ring-slate-200';

  return (
    <span
      className={cn(
        'inline-flex max-w-full items-center truncate font-medium ring-1 ring-inset rounded-full',
        size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm',
        colorClasses,
        className,
      )}
    >
      {text}
    </span>
  );
}
