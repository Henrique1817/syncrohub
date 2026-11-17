import { Flag, FolderKanban, Lightbulb, ListTodo, type LucideIcon } from 'lucide-react';
import { cn, isThisMonth } from '../../lib/utils';
import { useUI } from '../../store/ui';
import type { Idea, ProjectDetail, ProjectOverview } from '../../types';
import { Skeleton } from '../ui/States';

interface Kpi {
  label: string;
  value: number | null;
  hint: string;
  icon: LucideIcon;
  accent: string;
  onClick?: () => void;
}

interface KpiCardsProps {
  projects: ProjectOverview[];
  details: Record<string, ProjectDetail>;
  ideas: Idea[] | undefined;
}

export function KpiCards({ projects, details, ideas }: KpiCardsProps) {
  const navigate = useUI((s) => s.navigate);

  const active = projects.filter((p) => p.status !== 'COMPLETED');
  const withOverdue = projects.filter((p) => p.overdueStages > 0).length;
  const stages = Object.values(details).flatMap((d) => d.stages);
  const detailsLoaded = Object.keys(details).length === projects.length;
  const underReview = ideas?.filter((i) => i.status === 'UNDER_REVIEW') ?? [];

  const kpis: Kpi[] = [
    {
      label: 'Projetos ativos',
      value: active.length,
      hint: withOverdue ? `${withOverdue} com etapas atrasadas` : 'Nenhum com atraso',
      icon: FolderKanban,
      accent: 'bg-indigo-50 text-indigo-600',
    },
    {
      label: 'Etapas concluídas no mês',
      value: detailsLoaded ? stages.filter((s) => s.status === 'DONE' && isThisMonth(s.completedAt)).length : null,
      hint: `${projects.reduce((sum, p) => sum + p.doneStages, 0)} de ${projects.reduce((sum, p) => sum + p.totalStages, 0)} etapas no total`,
      icon: Flag,
      accent: 'bg-emerald-50 text-emerald-600',
    },
    {
      label: 'Tasks pendentes',
      value: projects.reduce((sum, p) => sum + p.openTasks, 0),
      hint: `${projects.reduce((sum, p) => sum + p.pendingManagerRequests, 0)} vieram de gestores`,
      icon: ListTodo,
      accent: 'bg-amber-50 text-amber-600',
    },
    {
      label: 'Ideias em análise',
      value: ideas ? underReview.length : null,
      hint: `${underReview.filter((i) => !i.engineerFeedback).length} aguardando parecer`,
      icon: Lightbulb,
      accent: 'bg-violet-50 text-violet-600',
      onClick: () => navigate({ name: 'ideas' }),
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {kpis.map(({ label, value, hint, icon: Icon, accent, onClick }) => {
        const Wrapper = onClick ? 'button' : 'div';
        return (
          <Wrapper
            key={label}
            onClick={onClick}
            className={cn(
              'rounded-xl border border-zinc-200 bg-white p-4 text-left shadow-xs',
              onClick && 'transition hover:border-zinc-300 hover:shadow-sm',
            )}
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-zinc-500">{label}</p>
              <span className={cn('flex h-7 w-7 items-center justify-center rounded-lg', accent)}>
                <Icon className="h-3.5 w-3.5" />
              </span>
            </div>
            {value === null ? (
              <Skeleton className="mt-3 h-8 w-12" />
            ) : (
              <p className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950 tabular-nums">{value}</p>
            )}
            <p className="mt-1 text-xs text-zinc-500">{hint}</p>
          </Wrapper>
        );
      })}
    </div>
  );
}
