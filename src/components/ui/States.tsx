import type { ReactNode } from 'react';
import { AlertCircle, Inbox, Loader2, RotateCw } from 'lucide-react';
import { getErrorMessage } from '../../api/client';
import { cn } from '../../lib/utils';
import { Button } from './Button';

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn('h-4 w-4 animate-spin text-zinc-400', className)} />;
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-zinc-200/70', className)} />;
}

export function PageLoader({ label = 'Carregando…' }: { label?: string }) {
  return (
    <div className="flex h-64 flex-col items-center justify-center gap-3 text-sm text-zinc-500">
      <Spinner className="h-5 w-5" />
      {label}
    </div>
  );
}

export function ErrorState({ error, onRetry, className }: { error: unknown; onRetry?: () => void; className?: string }) {
  return (
    <div className={cn('flex flex-col items-center rounded-xl border border-rose-200 bg-rose-50/60 px-6 py-10 text-center', className)}>
      <AlertCircle className="h-6 w-6 text-rose-500" />
      <p className="mt-3 text-sm font-medium text-rose-900">Não foi possível carregar os dados</p>
      <p className="mt-1 max-w-md text-xs text-rose-700/80">{getErrorMessage(error)}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" icon={RotateCw} className="mt-4" onClick={onRetry}>
          Tentar novamente
        </Button>
      )}
    </div>
  );
}

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed border-zinc-300 bg-white px-6 py-12 text-center">
      <Inbox className="h-7 w-7 text-zinc-300" />
      <p className="mt-3 text-sm font-medium text-zinc-700">{title}</p>
      {description && <p className="mt-1 max-w-sm text-xs text-zinc-500">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
