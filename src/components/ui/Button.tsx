import Link from 'next/link';
import { cn } from '@/lib/utils';

type ButtonVariant = 'primary' | 'secondary' | 'accent' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  href?: string;
  children: React.ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-apcrda-primary text-white hover:bg-apcrda-primary-light shadow-sm',
  secondary: 'bg-apcrda-secondary text-white hover:bg-apcrda-secondary-light shadow-sm',
  accent: 'bg-apcrda-accent text-white hover:bg-apcrda-accent-light shadow-sm',
  outline:
    'border border-slate-200 bg-white text-apcrda-primary hover:bg-slate-50 hover:border-slate-300',
  ghost: 'text-slate-600 hover:bg-slate-100 hover:text-apcrda-primary',
  danger: 'bg-red-600 text-white hover:bg-red-700 shadow-sm',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs rounded-lg',
  md: 'px-4 py-2 text-sm rounded-lg',
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
    'inline-flex items-center justify-center gap-2 font-medium transition-all duration-200',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-apcrda-primary/30 focus-visible:ring-offset-2',
    'disabled:opacity-50 disabled:pointer-events-none',
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
