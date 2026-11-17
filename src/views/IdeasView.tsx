import { useState } from 'react';
import { Lightbulb, UserRound, Users } from 'lucide-react';
import { IdeaCard } from '../components/ideas/IdeaCard';
import { Button } from '../components/ui/Button';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import { EmptyState, ErrorState, PageLoader } from '../components/ui/States';
import { IDEA_STATUS_META } from '../lib/constants';
import { cn } from '../lib/utils';
import { useIdeas } from '../queries/ideas';
import { useCurrentUser } from '../store/session';
import { useUI } from '../store/ui';
import type { IdeaStatus } from '../types';

type Filter = 'ALL' | IdeaStatus;
type Scope = 'all' | 'mine';

const FILTERS: Filter[] = ['ALL', 'UNDER_REVIEW', 'APPROVED', 'IMPLEMENTED', 'ARCHIVED'];

export function IdeasView() {
  const user = useCurrentUser();
  const openModal = useUI((s) => s.openModal);
  const [filter, setFilter] = useState<Filter>('ALL');
  const [scope, setScope] = useState<Scope>('all');
  const isManager = user.role !== 'ENGINEER';

  // Busca tudo uma vez e filtra no cliente: os contadores das abas usam a mesma lista.
  const ideas = useIdeas();

  const scoped = (ideas.data ?? []).filter((i) => !(isManager && scope === 'mine') || i.authorId === user.id);
  const visible = scoped.filter((i) => filter === 'ALL' || i.status === filter);
  const countFor = (f: Filter) => (f === 'ALL' ? scoped.length : scoped.filter((i) => i.status === f).length);

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 md:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">Central de Ideias & Sugestões</h1>
          <p className="mt-1 max-w-xl text-sm text-zinc-500">
            {isManager
              ? 'Envie ideias e ajustes. Cada sugestão recebe um parecer técnico e você acompanha até a entrega.'
              : 'Dê parecer técnico, arquive ou converta a sugestão em task com 1 clique.'}
          </p>
        </div>
        {isManager && (
          <Button icon={Lightbulb} onClick={() => openModal('IDEA')}>
            Enviar ideia
          </Button>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition',
                filter === f ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-600 ring-1 ring-zinc-200 ring-inset hover:bg-zinc-50',
              )}
            >
              {f === 'ALL' ? 'Todas' : IDEA_STATUS_META[f].label}
              <span className="text-zinc-400 tabular-nums">{countFor(f)}</span>
            </button>
          ))}
        </div>
        {isManager && (
          <SegmentedControl<Scope>
            value={scope}
            onChange={setScope}
            options={[
              { value: 'all', label: 'Todas', icon: Users },
              { value: 'mine', label: 'Minhas', icon: UserRound },
            ]}
          />
        )}
      </div>

      {ideas.isPending && <PageLoader label="Carregando ideias…" />}
      {ideas.isError && <ErrorState error={ideas.error} onRetry={() => void ideas.refetch()} />}

      {ideas.data &&
        (visible.length ? (
          <div className="space-y-4">
            {visible.map((idea) => (
              <IdeaCard key={idea.id} idea={idea} />
            ))}
          </div>
        ) : (
          <EmptyState title="Nada por aqui" description="Nenhuma ideia corresponde a este filtro." />
        ))}
    </div>
  );
}
