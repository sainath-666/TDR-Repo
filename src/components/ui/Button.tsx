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
    'bg-gradient-to-r from-apcrda-primary to-apcrda-primary-light text-white shadow-md hover:brightness-110 active:brightness-95',
  secondary:
    'bg-gradient-to-r from-apcrda-secondary to-apcrda-secondary-light text-white shadow-md hover:brightness-110 active:brightness-95',
  accent:
    'bg-gradient-to-r from-apcrda-accent to-apcrda-accent-light text-white shadow-md hover:brightness-110 active:brightness-95',
  portal:
    'bg-gradient-to-r from-apcrda-portal-purple to-apcrda-portal-purple-light text-white shadow-md hover:brightness-110 active:brightness-95',
  outline:
    'border-2 border-apcrda-primary/30 bg-white text-apcrda-primary shadow-sm hover:border-apcrda-primary hover:bg-indigo-50/50',
  ghost: 'text-slate-600 hover:bg-indigo-50 hover:text-apcrda-primary',
  danger:
    'bg-gradient-to-r from-red-600 to-red-500 text-white shadow-md hover:brightness-110 active:brightness-95',
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
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-apcrda-primary/30 focus-visible:ring-offset-2',
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
