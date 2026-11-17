import {
  Archive,
  ArchiveRestore,
  CheckCircle2,
  Flag,
  FolderKanban,
  Lightbulb,
  ListPlus,
  MessageSquare,
  Megaphone,
  Rocket,
  type LucideIcon,
} from 'lucide-react';
import { cn, relativeTime } from '../../lib/utils';
import { useActivity } from '../../queries/activity';
import { useUI } from '../../store/ui';
import type { ActivityAction } from '../../types';
import { ErrorState, Skeleton } from '../ui/States';

const ACTION_ICON: Partial<Record<ActivityAction, { icon: LucideIcon; className: string }>> = {
  PROJECT_CREATED: { icon: FolderKanban, className: 'bg-indigo-50 text-indigo-600' },
  PROJECT_ARCHIVED: { icon: Archive, className: 'bg-zinc-200 text-zinc-600' },
  PROJECT_RESTORED: { icon: ArchiveRestore, className: 'bg-indigo-50 text-indigo-600' },
  STAGE_ADVANCED: { icon: Flag, className: 'bg-emerald-500 text-white' },
  TASK_CREATED: { icon: ListPlus, className: 'bg-zinc-100 text-zinc-600' },
  TASK_TRIAGED: { icon: Megaphone, className: 'bg-violet-50 text-violet-600' },
  TASK_STATUS_CHANGED: { icon: CheckCircle2, className: 'bg-emerald-50 text-emerald-600' },
  IDEA_SUBMITTED: { icon: Lightbulb, className: 'bg-amber-50 text-amber-600' },
  IDEA_APPROVED: { icon: Lightbulb, className: 'bg-emerald-50 text-emerald-600' },
  IDEA_FEEDBACK: { icon: MessageSquare, className: 'bg-sky-50 text-sky-600' },
  COMMENT_ADDED: { icon: MessageSquare, className: 'bg-sky-50 text-sky-600' },
  ENGINEER_UPDATE: { icon: Rocket, className: 'bg-zinc-900 text-white' },
};

const FALLBACK_ICON = { icon: CheckCircle2, className: 'bg-zinc-100 text-zinc-500' };

export function ActivityFeed() {
  const navigate = useUI((s) => s.navigate);
  const activity = useActivity({ limit: 8 });

  return (
    <section className="rounded-xl border border-zinc-200 bg-white shadow-xs">
      <header className="border-b border-zinc-100 px-5 py-4">
        <h2 className="text-sm font-semibold">Atividade recente</h2>
        <p className="text-xs text-zinc-500">Entregas, decisões e pedidos em todos os projetos</p>
      </header>

      {activity.isPending && (
        <div className="space-y-3 px-5 py-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-9" />
          ))}
        </div>
      )}

      {activity.isError && <ErrorState error={activity.error} onRetry={() => void activity.refetch()} className="m-4" />}

      {activity.data?.length === 0 && <p className="px-5 py-6 text-center text-xs text-zinc-400">Nada registrado ainda.</p>}

      {!!activity.data?.length && (
        <ol className="relative px-5 py-4">
          <span aria-hidden className="absolute top-6 bottom-6 left-[29px] w-px bg-zinc-200" />
          {activity.data.map((entry) => {
            const { icon: Icon, className } = ACTION_ICON[entry.actionType] ?? FALLBACK_ICON;
            return (
              <li key={entry.id} className="relative flex gap-3 py-2">
                <span
                  className={cn(
                    'relative z-10 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ring-4 ring-white',
                    className,
                  )}
                >
                  <Icon className="h-3 w-3" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm leading-snug text-zinc-800">{entry.description}</p>
                  <p className="mt-0.5 text-[11px] text-zinc-500">
                    {entry.userName && <span>{entry.userName} · </span>}
                    {entry.projectId && entry.projectName && (
                      <>
                        <button
                          onClick={() => navigate({ name: 'project', projectId: entry.projectId! })}
                          className="font-medium text-zinc-600 hover:text-indigo-600"
                        >
                          {entry.projectName}
                        </button>{' '}
                        ·{' '}
                      </>
                    )}
                    {relativeTime(entry.createdAt)}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
