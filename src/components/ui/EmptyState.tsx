import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './Button';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn('flex flex-col items-center justify-center py-16 px-6 text-center', className)}
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mb-4">
        <Icon className="h-8 w-8" strokeWidth={1.5} />
      </div>
      <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>
      {actionLabel && actionHref && (
        <Button href={actionHref} className="mt-6">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
