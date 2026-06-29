import { BondStatus } from '@prisma/client';
import { BOND_STATUS_VARIANTS, STATUS_VARIANT_CLASSES, formatBondStatus } from '@/lib/bond-status';
import { cn } from '@/lib/utils';

interface BadgeProps {
  status?: BondStatus;
  label?: string;
  className?: string;
  size?: 'sm' | 'md';
}

export function Badge({ status, label, className, size = 'sm' }: BadgeProps) {
  const text = label ?? (status ? formatBondStatus(status) : '');
  const variant = status ? BOND_STATUS_VARIANTS[status] : 'slate';

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium ring-1 ring-inset rounded-full',
        size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm',
        STATUS_VARIANT_CLASSES[variant],
        className,
      )}
    >
      {text}
    </span>
  );
}
