import { BOARD_STATUSES, TASK_STATUS_META } from '../../lib/constants';
import { cn } from '../../lib/utils';
import { useChangeTaskStatus } from '../../queries/tasks';
import type { Task, TaskStatus } from '../../types';
import { compactSelectClass } from '../ui/Field';

export function TaskStatusSelect({ task, className }: { task: Task; className?: string }) {
  const changeStatus = useChangeTaskStatus(task.projectId);
  return (
    <select
      value={task.status}
      onChange={(e) => {
        const status = e.target.value as TaskStatus;
        if (status !== task.status) changeStatus.mutate({ taskId: task.id, status });
      }}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      aria-label="Alterar status"
      className={cn(compactSelectClass, className)}
    >
      {BOARD_STATUSES.map((status) => (
        <option key={status} value={status}>
          {TASK_STATUS_META[status].label}
        </option>
      ))}
    </select>
  );
}

export function TaskStatusPill({ status }: { status: TaskStatus }) {
  const meta = TASK_STATUS_META[status];
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-600">
      <span className={cn('h-1.5 w-1.5 rounded-full', meta.dot)} />
      {meta.label}
    </span>
  );
}
