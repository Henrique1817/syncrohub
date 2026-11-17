import { CheckCheck, Inbox, Lightbulb, type LucideIcon } from 'lucide-react';
import { PRIORITY_META } from '../../lib/constants';
import { firstName, relativeTime } from '../../lib/utils';
import { useTriageQueue } from '../../queries/tasks';
import { useUI } from '../../store/ui';
import type { Idea, View } from '../../types';
import { Badge } from '../ui/Badge';
import { Skeleton } from '../ui/States';

interface AttentionItem {
  id: string;
  icon: LucideIcon;
  iconClass: string;
  label: string;
  title: string;
  meta: string;
  target: View;
}

/** Visão do engenheiro: ideias sem parecer e a fila de triagem (GET /tasks/triage). */
export function EngineerQueuePanel({ ideas }: { ideas: Idea[] | undefined }) {
  const navigate = useUI((s) => s.navigate);
  const triage = useTriageQueue();

  const items: AttentionItem[] = [
    ...(ideas ?? [])
      .filter((i) => i.status === 'UNDER_REVIEW' && !i.engineerFeedback)
      .map<AttentionItem>((i) => ({
        id: i.id,
        icon: Lightbulb,
        iconClass: 'bg-amber-50 text-amber-600',
        label: `Ideia de ${firstName(i.authorName)}`,
        title: i.title,
        meta: `${i.projectName ?? 'Geral'} · ${relativeTime(i.createdAt)}`,
        target: { name: 'ideas' },
      })),
    ...(triage.data ?? []).map<AttentionItem>((t) => ({
      id: t.id,
      icon: Inbox,
      iconClass: 'bg-violet-50 text-violet-600',
      label: `Triagem · ${firstName(t.createdByName)} · prioridade ${PRIORITY_META[t.priority].label.toLowerCase()}`,
      title: t.title,
      meta: relativeTime(t.createdAt),
      target: { name: 'project', projectId: t.projectId },
    })),
  ];

  const loading = triage.isPending || !ideas;

  return (
    <section className="rounded-xl border border-zinc-200 bg-white shadow-xs">
      <header className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
        <div>
          <h2 className="text-sm font-semibold">Precisa da sua atenção</h2>
          <p className="text-xs text-zinc-500">Ideias sem parecer e demandas em triagem</p>
        </div>
        {items.length > 0 && <Badge tone="rose">{items.length}</Badge>}
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
          {items.map(({ id, icon: Icon, iconClass, label, title, meta, target }) => (
            <li key={id}>
              <button onClick={() => navigate(target)} className="flex w-full items-start gap-3 px-5 py-3 text-left transition hover:bg-zinc-50/70">
                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${iconClass}`}>
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-medium text-zinc-500">{label}</p>
                  <p className="truncate text-sm font-medium text-zinc-800">{title}</p>
                  <p className="mt-0.5 text-[11px] text-zinc-400">{meta}</p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      {!loading && items.length === 0 && (
        <div className="flex flex-col items-center px-5 py-8 text-center">
          <CheckCheck className="h-6 w-6 text-emerald-500" />
          <p className="mt-2 text-sm text-zinc-600">Tudo em dia. Nenhuma pendência.</p>
        </div>
      )}
    </section>
  );
}
