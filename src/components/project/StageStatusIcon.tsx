import { CheckCircle2, Circle } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { StageStatus } from '../../types';

export function StageStatusIcon({ status, className }: { status: StageStatus; className?: string }) {
  if (status === 'DONE') return <CheckCircle2 className={cn('h-4 w-4 shrink-0 text-emerald-500', className)} />;
  if (status === 'ACTIVE') {
    return (
      <span className={cn('relative flex h-4 w-4 shrink-0 items-center justify-center', className)}>
        <span className="absolute inset-0 rounded-full border-2 border-indigo-500" />
        <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
      </span>
    );
  }
  return <Circle className={cn('h-4 w-4 shrink-0 text-zinc-300', className)} />;
}
