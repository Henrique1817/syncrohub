import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

export const inputClass =
  'w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-xs placeholder:text-zinc-400 transition focus:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10';

export const compactSelectClass =
  'h-7 rounded-md border border-zinc-200 bg-white px-1.5 text-[11px] font-medium text-zinc-700 shadow-xs focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/15';

interface FieldProps {
  label: string;
  hint?: string;
  htmlFor?: string;
  className?: string;
  children: ReactNode;
}

export function Field({ label, hint, htmlFor, className, children }: FieldProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={htmlFor} className="flex items-baseline justify-between text-xs font-medium text-zinc-700">
        {label}
        {hint && <span className="font-normal text-zinc-400">{hint}</span>}
      </label>
      {children}
    </div>
  );
}
