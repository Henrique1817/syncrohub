import type { ReactNode } from 'react';
import {
  AlertTriangle,
  CalendarClock,
  CalendarDays,
  ExternalLink,
  Flag,
  GitBranch,
  Lightbulb,
  Pencil,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { getErrorMessage } from '../../api/client';
import { PROJECT_STATUS_META } from '../../lib/constants';
import { canCreateTasks } from '../../lib/permissions';
import { cn, formatDate, isOverdue, pluralize } from '../../lib/utils';
import { useSyncProjectGitHub } from '../../queries/projects';
import { useCurrentUser } from '../../store/session';
import { useUI } from '../../store/ui';
import type { ProjectDetail } from '../../types';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { ProgressBar } from '../ui/ProgressBar';
import { StageStepper } from './StageStepper';

function Meta({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-[11px] text-zinc-400">{label}</dt>
      <dd className="mt-0.5 flex items-center gap-1.5 font-medium text-zinc-800">{children}</dd>
    </div>
  );
}

interface ProjectHeaderProps {
  project: ProjectDetail;
  selectedStageId?: string;
  onSelectStage: (stageId: string) => void;
}

export function ProjectHeader({ project, selectedStageId, onSelectStage }: ProjectHeaderProps) {
  const role = useCurrentUser().role;
  const isEngineer = role === 'ENGINEER';
  const openModal = useUI((s) => s.openModal);
  const openProjectForm = useUI((s) => s.openProjectForm);
  const toast = useUI((s) => s.toast);
  const syncGitHub = useSyncProjectGitHub(project.id);
  const status = PROJECT_STATUS_META[project.status];
  const hasOverdue = project.overdueStages > 0;
  const deliveryLate = project.status !== 'COMPLETED' && isOverdue(project.dueDate, project.status);

  return (
    <section className="rounded-xl border border-zinc-200 bg-white shadow-xs">
      <div className="flex flex-wrap items-start justify-between gap-6 p-5 md:p-6">
        <div className="max-w-2xl min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={status.tone}>{status.label}</Badge>
            {hasOverdue && (
              <Badge tone="amber" icon={AlertTriangle}>
                {pluralize(project.overdueStages, 'etapa atrasada', 'etapas atrasadas')}
              </Badge>
            )}
            {project.githubRepo && (
              <a
                href={project.githubUrl ?? `https://github.com/${project.githubRepo}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 rounded-md border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[11px] font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-100"
              >
                <GitBranch className="h-3 w-3 text-zinc-500" />
                {project.githubRepo}
              </a>
            )}
          </div>
          <h1 className="mt-2 text-xl font-semibold tracking-tight text-zinc-950 md:text-2xl">{project.name}</h1>
          {project.description && <p className="mt-1.5 text-sm leading-relaxed text-zinc-600">{project.description}</p>}

          <dl className="mt-5 flex flex-wrap gap-x-8 gap-y-3 text-xs">
            <Meta label="Responsável">
              <Avatar name={project.createdByName} seed={project.createdBy} size="xs" />
              {project.createdByName}
            </Meta>
            <Meta label="Etapa atual">
              <Flag className="h-3.5 w-3.5 text-indigo-500" />
              {project.currentStage?.title ?? 'Todas concluídas'}
            </Meta>
            <Meta label="Criado em">
              <CalendarDays className="h-3.5 w-3.5 text-zinc-400" />
              {formatDate(project.createdAt)}
            </Meta>
            <Meta label="Entrega prevista">
              <CalendarClock className={cn('h-3.5 w-3.5', deliveryLate ? 'text-rose-500' : 'text-zinc-400')} />
              {project.dueDate ? (
                <span className={deliveryLate ? 'text-rose-600' : undefined}>
                  {formatDate(project.dueDate)}
                  {deliveryLate && ' · atrasada'}
                </span>
              ) : (
                <span className="font-normal text-zinc-400">Não definida</span>
              )}
            </Meta>
          </dl>
        </div>

        <div className="w-full space-y-4 sm:w-64">
          <div>
            <div className="flex items-baseline justify-between">
              <span className="text-xs text-zinc-500">Progresso geral</span>
              <span className="text-3xl font-semibold tracking-tight tabular-nums">{project.progressPercentage}%</span>
            </div>
            <ProgressBar
              value={project.progressPercentage}
              barClassName={hasOverdue ? 'bg-amber-500' : status.bar}
              size="md"
              className="mt-2"
            />
            <p className="mt-2 text-xs text-zinc-500">
              {project.doneStages} de {project.totalStages} etapas concluídas
            </p>
          </div>
          {!project.archivedAt && (
          <div className="flex gap-2">
            {isEngineer ? (
              <>
                <Button variant="secondary" size="sm" icon={Pencil} onClick={() => openProjectForm(project.id)}>
                  Editar
                </Button>
                <Button
                  size="sm"
                  icon={Plus}
                  className="flex-1"
                  onClick={() => openModal('TASK', { projectId: project.id, stageId: selectedStageId })}
                >
                  Nova task
                </Button>
              </>
            ) : (
              <>
                <Button variant="secondary" size="sm" icon={Lightbulb} className="flex-1" onClick={() => openModal('IDEA', { projectId: project.id })}>
                  Ideia
                </Button>
                {canCreateTasks(role) && (
                  <Button size="sm" icon={Plus} className="flex-1" onClick={() => openModal('TASK', { projectId: project.id })}>
                    Adicionar demanda
                  </Button>
                )}
              </>
            )}
          </div>
          )}
          {project.githubRepo ? (
            <div className="flex gap-2">
              <a
                href={project.githubUrl ?? `https://github.com/${project.githubRepo}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 shadow-xs transition hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-950"
              >
                <GitBranch className="h-3.5 w-3.5" />
                Abrir no GitHub
                <ExternalLink className="h-3 w-3 text-zinc-400" />
              </a>
              {!project.archivedAt && isEngineer && (
                <Button
                  variant="secondary"
                  size="sm"
                  icon={RefreshCw}
                  disabled={syncGitHub.isPending}
                  onClick={() =>
                    syncGitHub.mutate(undefined, {
                      onSuccess: (res) => {
                        toast(
                          'GitHub sincronizado',
                          res.updatedTasks.length > 0
                            ? `${pluralize(res.updatedTasks.length, 'tarefa atualizada', 'tarefas atualizadas')} via commits.`
                            : `${res.processedCommits} commits verificados; nenhuma nova mudança.`,
                        );
                      },
                      onError: (err) => toast('Erro ao sincronizar GitHub', getErrorMessage(err)),
                    })
                  }
                >
                  {syncGitHub.isPending ? 'Sincronizando…' : 'Sincronizar'}
                </Button>
              )}
            </div>
          ) : (
            !project.archivedAt &&
            isEngineer && (
              <Button variant="secondary" size="sm" icon={GitBranch} className="w-full" onClick={() => openProjectForm(project.id)}>
                Conectar ao GitHub
              </Button>
            )
          )}
        </div>
      </div>

      <div className="border-t border-zinc-100 px-5 pt-5 pb-4 md:px-6">
        <StageStepper stages={project.stages} size="lg" selectedId={selectedStageId} onSelect={onSelectStage} />
      </div>
    </section>
  );
}
