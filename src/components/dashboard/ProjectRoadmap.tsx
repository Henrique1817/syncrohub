import { AlertTriangle, ArrowUpRight, FolderPlus, Inbox, Megaphone } from 'lucide-react';
import { PROJECT_STATUS_META } from '../../lib/constants';
import { sortStages } from '../../lib/selectors';
import { cn, formatDate, isOverdue, pluralize } from '../../lib/utils';
import { useCurrentUser } from '../../store/session';
import { useUI } from '../../store/ui';
import type { ProjectDetail, ProjectOverview } from '../../types';
import { AppLink } from '../ui/AppLink';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { ProgressBar } from '../ui/ProgressBar';
import { EmptyState, Skeleton } from '../ui/States';
import { StageStepper } from '../project/StageStepper';

function RoadmapRow({ project, detail }: { project: ProjectOverview; detail?: ProjectDetail }) {
  const isEngineer = useCurrentUser().role === 'ENGINEER';
  const status = PROJECT_STATUS_META[project.status];
  const hasOverdue = project.overdueStages > 0;
  const deliveryLate = project.status !== 'COMPLETED' && isOverdue(project.dueDate, project.status);

  return (
    <li>
      <AppLink
        to={{ name: 'project', projectId: project.id }}
        className="group block w-full px-5 py-5 text-left transition hover:bg-zinc-50/70"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={status.tone}>{status.label}</Badge>
              {project.currentStage && (
                <span className="text-[11px] text-zinc-500">
                  Etapa atual: <span className="font-medium text-zinc-700">{project.currentStage.title}</span>
                </span>
              )}
            </div>
            <p className="mt-1.5 flex items-center gap-1 text-sm font-semibold text-zinc-900 group-hover:text-indigo-600">
              <span className="truncate">{project.name}</span>
              <ArrowUpRight className="h-3.5 w-3.5 shrink-0 opacity-0 transition group-hover:opacity-100" />
            </p>
            <div className="mt-1.5 flex items-center gap-1.5 text-xs text-zinc-500">
              <Avatar name={project.createdByName} seed={project.createdBy} size="xs" />
              Responsável <span className="font-medium text-zinc-700">{project.createdByName}</span>
            </div>
          </div>

          <div className="w-full sm:w-44">
            <div className="flex items-baseline justify-between text-xs">
              <span className="text-zinc-500">Progresso</span>
              <span className="text-sm font-semibold text-zinc-900 tabular-nums">{project.progressPercentage}%</span>
            </div>
            <ProgressBar
              value={project.progressPercentage}
              barClassName={hasOverdue ? 'bg-amber-500' : status.bar}
              className="mt-1.5"
            />
            <p className="mt-1.5 text-right text-[11px] text-zinc-500">
              {project.doneStages} de {project.totalStages} etapas
            </p>
            {project.dueDate && (
              <p className={cn('mt-0.5 text-right text-[11px]', deliveryLate ? 'font-medium text-rose-600' : 'text-zinc-500')}>
                {deliveryLate ? 'Entrega atrasada · ' : 'Entrega prevista '}
                {formatDate(project.dueDate)}
              </p>
            )}
          </div>
        </div>

        {detail ? (
          <StageStepper stages={sortStages(detail.stages)} className="mt-5" />
        ) : (
          <Skeleton className="mt-5 h-9 w-full" />
        )}

        {(hasOverdue || isEngineer) && (
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
            {hasOverdue && (
              <p className="flex items-center gap-1.5 text-xs text-amber-700">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                {pluralize(project.overdueStages, 'etapa com prazo vencido', 'etapas com prazo vencido')}
              </p>
            )}
            {isEngineer && (
              <div className="ml-auto flex gap-3 text-[11px] text-zinc-500">
                <span className="tabular-nums">{project.openTasks} tasks abertas</span>
                {project.triageTasks > 0 && (
                  <span className="inline-flex items-center gap-1 text-amber-700 tabular-nums">
                    <Inbox className="h-3 w-3" />
                    {project.triageTasks} em triagem
                  </span>
                )}
                {project.pendingManagerRequests > 0 && (
                  <span className="inline-flex items-center gap-1 text-violet-600 tabular-nums">
                    <Megaphone className="h-3 w-3" />
                    {project.pendingManagerRequests} de gestores
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </AppLink>
    </li>
  );
}

interface ProjectRoadmapProps {
  projects: ProjectOverview[];
  details: Record<string, ProjectDetail>;
}

export function ProjectRoadmap({ projects, details }: ProjectRoadmapProps) {
  const isEngineer = useCurrentUser().role === 'ENGINEER';
  const openProjectForm = useUI((s) => s.openProjectForm);

  return (
    <section className="rounded-xl border border-zinc-200 bg-white shadow-xs">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 px-5 py-4">
        <div>
          <h2 className="text-sm font-semibold">Roadmap dos projetos</h2>
          <p className="text-xs text-zinc-500">Em que etapa cada projeto está hoje</p>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-zinc-500">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500" /> Concluída
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full ring-2 ring-indigo-500" /> Atual
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full ring-1 ring-zinc-300" /> Pendente
          </span>
        </div>
      </header>
      {projects.length ? (
        <ul className="divide-y divide-zinc-100">
          {projects.map((project) => (
            <RoadmapRow key={project.id} project={project} detail={details[project.id]} />
          ))}
        </ul>
      ) : (
        <div className="p-5">
          <EmptyState
            title="Nenhum projeto cadastrado"
            description={
              isEngineer
                ? 'Crie o primeiro projeto com as etapas que os gestores vão acompanhar.'
                : 'Os projetos criados pelo engenheiro aparecem aqui.'
            }
            action={
              isEngineer && (
                <Button icon={FolderPlus} onClick={() => openProjectForm()}>
                  Criar primeiro projeto
                </Button>
              )
            }
          />
        </div>
      )}
    </section>
  );
}
