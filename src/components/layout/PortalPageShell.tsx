import { cn } from '@/lib/utils';

interface PortalPageShellProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  subtitle?: string;
}

export function PortalPageShell({ title, children, className, subtitle }: PortalPageShellProps) {
  return (
    <div className={cn('portal-section min-h-[50vh]', className)}>
      <div className="portal-content-block">
        <div className="mb-8 text-center">
          <h1 className="portal-section-title">{title}</h1>
          <div className="portal-section-accent" />
          {subtitle && <p className="mt-4 text-sm text-slate-600">{subtitle}</p>}
        </div>
        {children}
      </div>
    </div>
  );
}
