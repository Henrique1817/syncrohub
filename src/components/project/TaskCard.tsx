import { Clock } from 'lucide-react';
import { PRIORITY_META } from '../../lib/constants';
import { cn, relativeTime } from '../../lib/utils';
import { useCurrentUser } from '../../store/session';
import type { Task } from '../../types';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { useUI } from '../../store/ui';
import { useCanEditProject } from './ProjectAccess';
import { SourceBadge } from './SourceBadge';
import { TaskDates } from './TaskDates';
import { TaskStatusSelect } from './TaskStatusSelect';

interface TaskCardProps {
  task: Task;
  overlay?: boolean;
}

export function TaskCard({ task, overlay }: TaskCardProps) {
  const isEngineer = useCurrentUser().role === 'ENGINEER';
  const canEdit = useCanEditProject();
  const fromManager = task.source !== 'ENGINEER';
  const showPriority = isEngineer || task.priority === 'CRITICAL';
  const openTask = useUI((s) => s.openTask);

  return (
    <article
      onClick={overlay ? undefined : () => openTask(task.id)}
      className={cn(
        'relative cursor-pointer rounded-lg border border-zinc-200 bg-white p-3 shadow-xs transition hover:border-zinc-300 hover:shadow-sm',
        fromManager && 'before:absolute before:inset-y-2 before:left-0 before:w-0.5 before:rounded-full before:bg-violet-400',
        task.status === 'DONE' && 'bg-zinc-50/80',
        overlay && 'rotate-[1.5deg] shadow-xl ring-2 ring-indigo-500/20',
      )}
    >
      {(fromManager || showPriority || true) && (
        <div className="mb-2 flex flex-wrap items-center gap-1.5">
          <span
            title="ID curto para referenciar em commits (ex: wip #id ou done #id)"
            className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-[10px] font-medium text-zinc-500"
          >
            #{task.id.slice(0, 8)}
          </span>
          <SourceBadge task={task} />
          {showPriority && <Badge tone={PRIORITY_META[task.priority].tone}>{PRIORITY_META[task.priority].label}</Badge>}
        </div>
      )}

      <p className={cn('text-sm leading-snug font-medium text-zinc-900', task.status === 'DONE' && 'text-zinc-500')}>
        {task.title}
      </p>
      {task.description && <p className="mt-1 line-clamp-2 text-xs text-zinc-500">{task.description}</p>}
      <TaskDates task={task} className="mt-2" />

      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="inline-flex min-w-0 items-center gap-1 truncate text-[11px] whitespace-nowrap text-zinc-400">
          <Clock className="h-3 w-3 shrink-0" />
          {task.status === 'DONE' && task.completedAt
            ? `Entregue ${relativeTime(task.completedAt)}`
            : `Criada ${relativeTime(task.createdAt)}`}
        </span>
        <div className="flex items-center gap-1.5">
          {canEdit && !overlay && <TaskStatusSelect task={task} />}
          <Avatar name={task.assignedToName} seed={task.assignedTo} title="Responsável" size="xs" />
        </div>
      </div>
    </article>
  );
}
