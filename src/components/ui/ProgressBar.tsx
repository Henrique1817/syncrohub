import { cn } from '../../lib/utils';

const SIZES = { xs: 'h-1', sm: 'h-1.5', md: 'h-2' };

interface ProgressBarProps {
  value: number;
  barClassName?: string;
  size?: keyof typeof SIZES;
  className?: string;
}

export function ProgressBar({ value, barClassName = 'bg-indigo-500', size = 'sm', className }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn('w-full overflow-hidden rounded-full bg-zinc-100', SIZES[size], className)}
    >
      <div className={cn('h-full rounded-full transition-[width] duration-500', barClassName)} style={{ width: `${clamped}%` }} />
    </div>
  );
}
