import { Inbox } from 'lucide-react';
import { PRIORITY_META } from '../../lib/constants';
import { pluralize, relativeTime } from '../../lib/utils';
import { useTriageTask } from '../../queries/tasks';
import { useCurrentUser } from '../../store/session';
import type { StageWithStats, Task } from '../../types';
import { Badge } from '../ui/Badge';
import { compactSelectClass } from '../ui/Field';
import { useCanEditProject } from './ProjectAccess';
import { SourceBadge } from './SourceBadge';
import { TaskDates } from './TaskDates';

/** Demandas de gestores em BACKLOG: o engenheiro escolhe a etapa e a task entra na fila. */
export function TriageBanner({ tasks, stages }: { tasks: Task[]; stages: StageWithStats[] }) {
  const isEngineer = useCurrentUser().role === 'ENGINEER';
  const canEdit = useCanEditProject();
  const triage = useTriageTask();
  const pending = tasks.filter((t) => t.status === 'BACKLOG');

  if (!pending.length) return null;

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
          <Inbox className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-amber-950">
            {pluralize(pending.length, 'demanda aguardando triagem', 'demandas aguardando triagem')}
          </h3>
          <p className="text-xs text-amber-800/80">
            {isEngineer
              ? 'Defina em qual etapa cada demanda entra na fila de desenvolvimento.'
              : 'O engenheiro vai definir em qual etapa cada demanda será atendida.'}
          </p>

          <ul className="mt-3 space-y-2">
            {pending.map((task) => (
              <li
                key={task.id}
                className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg bg-white px-3 py-2 ring-1 ring-amber-200/70"
              >
                <SourceBadge task={task} />
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-zinc-900">{task.title}</span>
                <Badge tone={PRIORITY_META[task.priority].tone}>{PRIORITY_META[task.priority].label}</Badge>
                {task.stageTitle && <span className="text-[11px] text-zinc-500">Sugestão: {task.stageTitle}</span>}
                <TaskDates task={task} />
                <span className="text-[11px] text-zinc-400">{relativeTime(task.createdAt)}</span>
                {canEdit ? (
                  <select
                    value=""
                    disabled={triage.isPending}
                    onChange={(e) => triage.mutate({ taskId: task.id, input: { stageId: e.target.value } })}
                    className={compactSelectClass}
                    aria-label="Enviar para etapa"
                  >
                    <option value="" disabled>
                      Enviar para etapa…
                    </option>
                    {stages.map((stage, index) => (
                      <option key={stage.id} value={stage.id}>
                        {index + 1}. {stage.title}
                        {stage.id === task.stageId ? ' (sugerida)' : ''}
                      </option>
                    ))}
                  </select>
                ) : (
                  <Badge tone="amber">Em triagem</Badge>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
