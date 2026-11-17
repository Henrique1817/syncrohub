import type { ButtonHTMLAttributes } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

type Variant = 'primary' | 'secondary' | 'ghost' | 'success' | 'danger';
type Size = 'xs' | 'sm' | 'md';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-zinc-900 text-white shadow-sm hover:bg-zinc-800 disabled:bg-zinc-300',
  secondary: 'bg-white text-zinc-800 shadow-xs ring-1 ring-inset ring-zinc-200 hover:bg-zinc-50 disabled:text-zinc-400',
  ghost: 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 disabled:text-zinc-300',
  success: 'bg-emerald-600 text-white shadow-sm hover:bg-emerald-500 disabled:bg-emerald-300',
  danger: 'text-rose-600 hover:bg-rose-50 disabled:text-rose-300',
};

const SIZES: Record<Size, string> = {
  xs: 'h-7 gap-1 px-2 text-xs',
  sm: 'h-8 gap-1.5 px-2.5 text-xs',
  md: 'h-9 gap-2 px-3.5 text-sm',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: LucideIcon;
}

export function Button({ variant = 'primary', size = 'md', icon: Icon, className, children, type = 'button', ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-lg font-medium whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:cursor-not-allowed',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    >
      {Icon && <Icon className={size === 'md' ? 'h-4 w-4' : 'h-3.5 w-3.5'} />}
      {children}
    </button>
  );
}
