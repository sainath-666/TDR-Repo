import Link from 'next/link';
import { cn } from '@/lib/utils';

type ButtonVariant = 'primary' | 'secondary' | 'accent' | 'portal' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  href?: string;
  children: React.ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-apcrda-primary text-white shadow-sm hover:bg-apcrda-primary-light active:bg-apcrda-primary-dark',
  secondary:
    'bg-apcrda-secondary text-white shadow-sm hover:bg-apcrda-secondary-light active:brightness-95',
  accent: 'bg-apcrda-accent text-white shadow-sm hover:bg-apcrda-accent-light active:brightness-95',
  portal:
    'bg-apcrda-portal-purple text-white shadow-sm hover:bg-apcrda-portal-purple-light active:bg-apcrda-portal-purple-dark',
  outline:
    'border border-slate-200 bg-white text-apcrda-primary shadow-sm hover:border-slate-300 hover:bg-slate-50',
  ghost: 'text-slate-600 hover:bg-slate-100 hover:text-apcrda-primary',
  danger: 'bg-red-600 text-white shadow-sm hover:bg-red-700 active:bg-red-800',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs rounded-lg',
  md: 'px-4 py-2.5 text-sm rounded-xl',
  lg: 'px-6 py-3 text-base rounded-xl',
};

export function Button({
  variant = 'primary',
  size = 'md',
  href,
  className,
  children,
  ...props
}: ButtonProps) {
  const classes = cn(
    'inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-apcrda-primary/25 focus-visible:ring-offset-2',
    'disabled:pointer-events-none disabled:opacity-50',
    variantClasses[variant],
    sizeClasses[size],
    className,
  );

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}
