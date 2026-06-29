import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
  breadcrumb?: string;
}

export function PageHeader({
  title,
  description,
  children,
  className,
  breadcrumb,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        'mb-6 animate-fade-in rounded-2xl border border-slate-200/70 bg-white p-5 shadow-card ring-1 ring-slate-100/80 md:mb-8 md:p-6',
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
