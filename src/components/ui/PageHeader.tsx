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
        'mb-6 md:mb-8 animate-fade-in rounded-2xl bg-white border border-slate-200 shadow-card p-5 md:p-6',
        className,
      )}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          {breadcrumb && (
            <p className="text-xs font-medium text-apcrda-secondary uppercase tracking-wider mb-1">
              {breadcrumb}
            </p>
          )}
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-apcrda-primary">
            {title}
          </h1>
          {description && (
            <p className="mt-1 text-sm text-slate-500 leading-relaxed">{description}</p>
          )}
        </div>
        {children && <div className="flex items-center gap-3 shrink-0">{children}</div>}
      </div>
    </div>
  );
}
