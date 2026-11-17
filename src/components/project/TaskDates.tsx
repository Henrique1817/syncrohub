import { CalendarRange } from 'lucide-react';
import { cn, formatDate, isOverdue } from '../../lib/utils';
import type { Task } from '../../types';

/** Período da task: "20 out → 28 out", "Até 28 out" ou "Desde 20 out". Vermelho quando a entrega venceu. */
export function TaskDates({ task, className }: { task: Pick<Task, 'startDate' | 'dueDate' | 'status'>; className?: string }) {
  const { startDate, dueDate } = task;
  if (!startDate && !dueDate) return null;

  const late = isOverdue(dueDate, task.status);
  const label =
    startDate && dueDate
      ? `${formatDate(startDate)} → ${formatDate(dueDate)}`
      : dueDate
        ? `Até ${formatDate(dueDate)}`
        : `Desde ${formatDate(startDate!)}`;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-[11px] whitespace-nowrap',
        late ? 'font-medium text-rose-600' : 'text-zinc-500',
        className,
      )}
    >
      <CalendarRange className="h-3 w-3 shrink-0" />
      {label}
      {late && ' · atrasada'}
    </span>
  );
}
