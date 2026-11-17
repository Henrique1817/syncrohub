import { PRIORITY_META, STAGE_STATUS_META } from '../../lib/constants';
import { stagePercent } from '../../lib/selectors';
import { cn, relativeTime } from '../../lib/utils';
import { useCanEditProject } from './ProjectAccess';
import type { StageWithStats, Task } from '../../types';
import { Badge } from '../ui/Badge';
import { ProgressBar } from '../ui/ProgressBar';
import { useUI } from '../../store/ui';
import { SourceBadge } from './SourceBadge';
import { TaskDates } from './TaskDates';
import { StageStatusIcon } from './StageStatusIcon';
import { TaskStatusPill, TaskStatusSelect } from './TaskStatusSelect';

function TaskRow({ task, editable }: { task: Task; editable: boolean }) {
  const openTask = useUI((s) => s.openTask);
  return (
    <li className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-4 py-2.5 transition hover:bg-zinc-50/70">
      <div className="w-28 shrink-0">{editable ? <TaskStatusSelect task={task} /> : <TaskStatusPill status={task.status} />}</div>
      <button
        type="button"
        onClick={() => openTask(task.id)}
        className={cn(
          'min-w-0 flex-1 truncate text-left text-sm text-zinc-800 hover:text-indigo-600',
          task.status === 'DONE' && 'text-zinc-400 line-through decoration-zinc-300',
        )}
      >
        {task.title}
      </button>
      <TaskDates task={task} />
      <SourceBadge task={task} />
      {editable && <Badge tone={PRIORITY_META[task.priority].tone}>{PRIORITY_META[task.priority].label}</Badge>}
      <span className="w-24 text-right text-[11px] text-zinc-400">
        {relativeTime(task.status === 'DONE' && task.completedAt ? task.completedAt : task.createdAt)}
      </span>
    </li>
  );
}

function TaskRows({ tasks, editable }: { tasks: Task[]; editable: boolean }) {
  if (!tasks.length) return <p className="px-4 py-3 text-xs text-zinc-400">Nenhuma task nesta etapa ainda.</p>;
  return (
    <ul className="divide-y divide-zinc-100">
      {tasks.map((task) => (
        <TaskRow key={task.id} task={task} editable={editable} />
      ))}
    </ul>
  );
}

export function TaskListGrouped({ stages, tasks }: { stages: StageWithStats[]; tasks: Task[] }) {
  const editable = useCanEditProject();
  // Tasks já triadas cuja etapa foi removida ficam com stage_id nulo (FK ON DELETE SET NULL).
  const orphans = tasks.filter((t) => !t.stageId && t.status !== 'BACKLOG');

  return (
    <div className="space-y-3">
      {stages.map((stage) => (
        <section key={stage.id} className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xs">
          <header className="flex flex-wrap items-center gap-3 border-b border-zinc-100 bg-zinc-50/60 px-4 py-2.5">
            <StageStatusIcon status={stage.status} />
            <h4 className="text-sm font-semibold text-zinc-900">{stage.title}</h4>
            <Badge tone={STAGE_STATUS_META[stage.status].tone}>{STAGE_STATUS_META[stage.status].label}</Badge>
            <div className="ml-auto flex items-center gap-2">
              <ProgressBar
                value={stagePercent(stage)}
                barClassName={stage.status === 'DONE' ? 'bg-emerald-500' : 'bg-indigo-500'}
                size="xs"
                className="w-20"
              />
              <span className="text-xs text-zinc-500 tabular-nums">
                {stage.doneTasks}/{stage.totalTasks}
              </span>
            </div>
          </header>
          <TaskRows tasks={tasks.filter((t) => t.stageId === stage.id)} editable={editable} />
        </section>
      ))}

      {orphans.length > 0 && (
        <section className="overflow-hidden rounded-xl border border-dashed border-zinc-300 bg-white">
          <header className="border-b border-zinc-100 px-4 py-2.5">
            <h4 className="text-sm font-semibold text-zinc-600">Sem etapa</h4>
          </header>
          <TaskRows tasks={orphans} editable={editable} />
        </section>
      )}
    </div>
  );
}
