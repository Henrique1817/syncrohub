import { ArrowUpRight, ListChecks, MessageSquareReply } from 'lucide-react';
import { DEPARTMENT_META, IDEA_CATEGORY_META, IDEA_STATUS_META, TASK_STATUS_META } from '../../lib/constants';
import { cn, relativeTime } from '../../lib/utils';
import { useUsers } from '../../queries/projects';
import { useTask } from '../../queries/tasks';
import { useCurrentUser } from '../../store/session';
import { useUI } from '../../store/ui';
import type { Idea } from '../../types';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { IdeaReviewPanel } from './IdeaReviewPanel';

function ConvertedTaskLink({ taskId }: { taskId: string }) {
  const navigate = useUI((s) => s.navigate);
  const task = useTask(taskId);
  if (!task.data) return null;

  return (
    <button
      onClick={() => navigate({ name: 'project', projectId: task.data.projectId })}
      className="group inline-flex items-center gap-1.5 rounded-md bg-white px-2 py-0.5 text-[11px] font-medium text-zinc-700 ring-1 ring-zinc-200 transition ring-inset hover:ring-zinc-300"
    >
      <ListChecks className="h-3 w-3 text-indigo-500" />
      Virou task{task.data.stageTitle ? ` na etapa "${task.data.stageTitle}"` : ''} · {TASK_STATUS_META[task.data.status].label}
      <ArrowUpRight className="h-3 w-3 text-zinc-400 group-hover:text-zinc-700" />
    </button>
  );
}

export function IdeaCard({ idea }: { idea: Idea }) {
  const isEngineer = useCurrentUser().role === 'ENGINEER';
  const navigate = useUI((s) => s.navigate);
  const users = useUsers();
  const reviewer = users.data?.find((u) => u.id === idea.reviewedBy);
  const category = IDEA_CATEGORY_META[idea.category];
  const status = IDEA_STATUS_META[idea.status];
  const awaitingReview = idea.status === 'UNDER_REVIEW' && !idea.engineerFeedback;

  return (
    <article
      className={cn(
        'overflow-hidden rounded-xl border bg-white shadow-xs transition',
        awaitingReview && isEngineer ? 'border-indigo-200 ring-4 ring-indigo-500/5' : 'border-zinc-200',
        idea.status === 'ARCHIVED' && 'opacity-70',
      )}
    >
      <div className="p-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={category.tone} icon={category.icon}>
            {category.label}
          </Badge>
          <Badge tone={status.tone}>{status.label}</Badge>
          {idea.projectId && idea.projectName ? (
            <button
              onClick={() => navigate({ name: 'project', projectId: idea.projectId! })}
              className="inline-flex max-w-56 items-center rounded-md px-1.5 py-0.5 text-[11px] font-medium text-zinc-600 ring-1 ring-zinc-200 transition ring-inset hover:bg-zinc-50 hover:text-zinc-900"
            >
              <span className="truncate">{idea.projectName}</span>
            </button>
          ) : (
            <Badge>Geral · sem projeto</Badge>
          )}
          <span className="ml-auto text-xs text-zinc-400">{relativeTime(idea.createdAt)}</span>
        </div>

        <h3 className="mt-3 text-base font-semibold tracking-tight text-zinc-950">{idea.title}</h3>
        <p className="mt-1 text-sm leading-relaxed whitespace-pre-line text-zinc-600">{idea.content}</p>

        <div className="mt-4 flex items-center gap-2 text-xs text-zinc-500">
          <Avatar name={idea.authorName} seed={idea.authorId} size="sm" />
          <span className="font-medium text-zinc-700">{idea.authorName}</span>
          {idea.authorPositionTitle && <span className="text-zinc-400">· {idea.authorPositionTitle}</span>}
          {idea.authorDepartment && (
            <Badge tone={DEPARTMENT_META[idea.authorDepartment].tone} icon={DEPARTMENT_META[idea.authorDepartment].icon}>
              {DEPARTMENT_META[idea.authorDepartment].label}
            </Badge>
          )}
        </div>
      </div>

      {(idea.engineerFeedback || idea.convertedTaskId) && (
        <div className="border-t border-zinc-100 bg-zinc-50/70 px-5 py-4">
          <p className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-zinc-500 uppercase">
            <MessageSquareReply className="h-3.5 w-3.5" />
            {idea.engineerFeedback ? 'Parecer técnico' : 'Encaminhamento'}
            {idea.reviewedAt && <span className="font-normal tracking-normal normal-case">· {relativeTime(idea.reviewedAt)}</span>}
          </p>
          {idea.engineerFeedback && (
            <div className="mt-2 flex gap-2.5">
              <Avatar name={reviewer?.name ?? 'Engenheiro'} seed={idea.reviewedBy} size="xs" className="mt-0.5" />
              <p className="text-sm leading-relaxed whitespace-pre-line text-zinc-700">{idea.engineerFeedback}</p>
            </div>
          )}
          {idea.convertedTaskId && (
            <div className="mt-3">
              <ConvertedTaskLink taskId={idea.convertedTaskId} />
            </div>
          )}
        </div>
      )}

      {isEngineer && <IdeaReviewPanel idea={idea} />}
    </article>
  );
}
