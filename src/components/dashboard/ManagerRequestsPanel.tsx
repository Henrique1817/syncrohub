import { Lightbulb, ListPlus, Megaphone, Plus } from 'lucide-react';
import { IDEA_STATUS_META, TASK_STATUS_META } from '../../lib/constants';
import { canCreateTasks } from '../../lib/permissions';
import { relativeTime } from '../../lib/utils';
import { useTriageQueue } from '../../queries/tasks';
import { useCurrentUser } from '../../store/session';
import { useUI } from '../../store/ui';
import type { Idea, Tone, View } from '../../types';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Skeleton } from '../ui/States';

interface RequestItem {
  id: string;
  kind: 'task' | 'idea';
  title: string;
  context: string;
  statusLabel: string;
  tone: Tone;
  createdAt: string;
  target: View;
}

/**
 * Visão do gestor. A API não tem (ainda) um "minhas tasks" global, então combinamos
 * as ideias do autor com as demandas dele que estão em triagem.
 */
export function ManagerRequestsPanel({ ideas }: { ideas: Idea[] | undefined }) {
  const user = useCurrentUser();
  const role = user.role;
  const navigate = useUI((s) => s.navigate);
  const openModal = useUI((s) => s.openModal);
  const triage = useTriageQueue();

  const items: RequestItem[] = [
    ...(triage.data ?? [])
      .filter((t) => t.createdBy === user.id)
      .map<RequestItem>((t) => ({
        id: t.id,
        kind: 'task',
        title: t.title,
        context: 'Demanda',
        statusLabel: TASK_STATUS_META[t.status].label,
        tone: TASK_STATUS_META[t.status].tone,
        createdAt: t.createdAt,
        target: { name: 'project', projectId: t.projectId },
      })),
    ...(ideas ?? [])
      .filter((i) => i.authorId === user.id)
      .map<RequestItem>((i) => ({
        id: i.id,
        kind: 'idea',
        title: i.title,
        context: i.projectName ?? 'Geral',
        statusLabel: IDEA_STATUS_META[i.status].label,
        tone: IDEA_STATUS_META[i.status].tone,
        createdAt: i.createdAt,
        target: { name: 'ideas' },
      })),
  ]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 6);

  const loading = triage.isPending || !ideas;

  return (
    <section className="rounded-xl border border-zinc-200 bg-white shadow-xs">
      <header className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
        <div>
          <h2 className="text-sm font-semibold">Suas solicitações</h2>
          <p className="text-xs text-zinc-500">Ideias enviadas e demandas em triagem</p>
        </div>
        <Button size="xs" variant="secondary" icon={Plus} onClick={() => openModal(canCreateTasks(role) ? 'TASK' : 'IDEA')}>
          Nova
        </Button>
      </header>

      {loading && (
        <div className="space-y-3 px-5 py-4">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-9" />
          ))}
        </div>
      )}

      {!loading && items.length > 0 && (
        <ul className="divide-y divide-zinc-100">
          {items.map((item) => {
            const Icon = item.kind === 'task' ? Megaphone : Lightbulb;
            return (
              <li key={item.id}>
                <button onClick={() => navigate(item.target)} className="flex w-full items-start gap-3 px-5 py-3 text-left transition hover:bg-zinc-50/70">
                  <Icon className={item.kind === 'task' ? 'mt-0.5 h-4 w-4 shrink-0 text-violet-500' : 'mt-0.5 h-4 w-4 shrink-0 text-amber-500'} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-zinc-800">{item.title}</p>
                    <p className="mt-0.5 truncate text-[11px] text-zinc-500">
                      {item.context} · {relativeTime(item.createdAt)}
                    </p>
                  </div>
                  <Badge tone={item.tone}>{item.statusLabel}</Badge>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {!loading && items.length === 0 && (
        <div className="flex flex-col items-center px-5 py-8 text-center">
          <ListPlus className="h-6 w-6 text-zinc-300" />
          <p className="mt-2 text-sm text-zinc-600">Nenhuma solicitação pendente.</p>
        </div>
      )}
    </section>
  );
}
