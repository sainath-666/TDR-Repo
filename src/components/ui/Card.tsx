import { cn } from '@/lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  padding?: 'none' | 'xs' | 'sm' | 'md' | 'lg';
  style?: React.CSSProperties;
}

const paddingClasses = {
  none: '',
  xs: 'p-3',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
};

export function Card({ children, className, hover = false, padding = 'md', style }: CardProps) {
  return (
    <div
      style={style}
      className={cn(
        'rounded-2xl border border-indigo-100/60 bg-white shadow-card ring-1 ring-indigo-50',
        hover && 'transition-all duration-200 hover:border-slate-200 hover:shadow-card-hover',
        paddingClasses[padding],
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn('mb-4', className)}>{children}</div>;
}

export function CardTitle({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h3 className={cn('text-base font-semibold tracking-tight text-apcrda-primary', className)}>
      {children}
    </h3>
  );
}
