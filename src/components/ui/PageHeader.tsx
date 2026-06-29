import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
  breadcrumb?: string;
  compact?: boolean;
}

export function PageHeader({
  title,
  description,
  children,
  className,
  breadcrumb,
  compact = false,
}: PageHeaderProps) {
  if (compact) {
    return (
      <div
        className={cn(
          'flex shrink-0 flex-wrap items-center justify-between gap-2 rounded-xl border border-indigo-100/80 border-l-4 border-l-apcrda-secondary bg-white px-3 py-2.5 shadow-sm',
          className,
        )}
      >
        <div className="min-w-0">
          {breadcrumb && (
            <p className="text-[10px] font-semibold uppercase tracking-wider text-apcrda-secondary">
              {breadcrumb}
            </p>
          )}
          <h1 className="text-base font-bold tracking-tight text-apcrda-primary">{title}</h1>
          {description && <p className="truncate text-xs text-slate-600">{description}</p>}
        </div>
        {children && <div className="flex shrink-0 items-center gap-2">{children}</div>}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'mb-6 animate-fade-in rounded-2xl border border-indigo-100/80 border-l-4 border-l-apcrda-secondary bg-white p-5 shadow-card md:mb-8 md:p-6',
        className,
      )}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          {breadcrumb && (
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-apcrda-secondary">
              {breadcrumb}
            </p>
          )}
          <h1 className="text-xl font-bold tracking-tight text-apcrda-primary md:text-2xl">
            {title}
          </h1>
          {description && (
            <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{description}</p>
          )}
        </div>
        {children && <div className="flex shrink-0 items-center gap-3">{children}</div>}
      </div>
    </div>
  );
}
