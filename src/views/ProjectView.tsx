import { useState } from 'react';
import { ArrowLeft, KanbanSquare, ListTree } from 'lucide-react';
import { ArchivedProjectBanner } from '../components/project/ArchivedProjectBanner';
import { ProjectEditableContext } from '../components/project/ProjectAccess';
import { ProjectHeader } from '../components/project/ProjectHeader';
import { StageRail } from '../components/project/StageRail';
import { TaskBoard } from '../components/project/TaskBoard';
import { TaskDetailsModal } from '../components/project/TaskDetailsModal';
import { TaskListGrouped } from '../components/project/TaskListGrouped';
import { TriageBanner } from '../components/project/TriageBanner';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import { ErrorState, PageLoader } from '../components/ui/States';
import { STAGE_STATUS_META } from '../lib/constants';
import { getCurrentStage, sortStages } from '../lib/selectors';
import { useProject } from '../queries/projects';
import { useProjectTasks } from '../queries/tasks';
import { useCurrentUser } from '../store/session';
import { useUI } from '../store/ui';

type Layout = 'board' | 'list';

export function ProjectView({ projectId }: { projectId: string }) {
  const isEngineer = useCurrentUser().role === 'ENGINEER';
  const navigate = useUI((s) => s.navigate);
  const openTaskId = useUI((s) => s.openTaskId);
  const projectQuery = useProject(projectId);
  const tasksQuery = useProjectTasks(projectId);

  const [selectedStageId, setSelectedStageId] = useState<string>();
  const [layout, setLayout] = useState<Layout>(isEngineer ? 'board' : 'list');

  if (projectQuery.isPending || tasksQuery.isPending) return <PageLoader label="Carregando projeto…" />;

  if (projectQuery.isError || tasksQuery.isError) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 p-8">
        <button
          onClick={() => navigate({ name: 'dashboard' })}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 transition hover:text-zinc-900"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Voltar para a visão geral
        </button>
        <ErrorState
          error={projectQuery.error ?? tasksQuery.error}
          onRetry={() => {
            void projectQuery.refetch();
            void tasksQuery.refetch();
          }}
        />
      </div>
    );
  }

  const project = projectQuery.data;
  const tasks = tasksQuery.data;
  const stages = sortStages(project.stages);
  const selectedStage = stages.find((s) => s.id === selectedStageId) ?? getCurrentStage(stages) ?? stages[0];
  const stageTasks = tasks.filter((t) => t.stageId === selectedStage?.id && t.status !== 'BACKLOG');

  const selectStage = (stageId: string) => {
    setSelectedStageId(stageId);
    setLayout('board');
  };

  return (
    <ProjectEditableContext.Provider value={!project.archivedAt}>
    <div className="mx-auto max-w-[1400px] space-y-6 p-4 md:p-8">
      <button
        onClick={() => navigate({ name: 'dashboard' })}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 transition hover:text-zinc-900"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Voltar para a visão geral
      </button>

      <ArchivedProjectBanner project={project} />

      <ProjectHeader project={{ ...project, stages }} selectedStageId={selectedStage?.id} onSelectStage={selectStage} />

      <TriageBanner tasks={tasks} stages={stages} />

      <div className="grid items-start gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
        <StageRail projectId={projectId} stages={stages} selectedId={selectedStage?.id} onSelect={selectStage} />

        <section className="min-w-0 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-zinc-900">
                {layout === 'board' ? `Tasks · ${selectedStage?.title ?? 'sem etapas'}` : 'Todas as tasks por etapa'}
              </h2>
              <p className="text-xs text-zinc-500">
                {layout === 'board' && selectedStage
                  ? `${STAGE_STATUS_META[selectedStage.status].label} · ${stageTasks.length} tasks${
                      isEngineer && !project.archivedAt ? ' · arraste os cards entre as colunas' : ''
                    }`
                  : `${tasks.length} tasks em ${stages.length} etapas`}
              </p>
            </div>
            <SegmentedControl<Layout>
              value={layout}
              onChange={setLayout}
              options={[
                { value: 'board', label: 'Quadro', icon: KanbanSquare },
                { value: 'list', label: 'Lista por etapa', icon: ListTree },
              ]}
            />
          </div>

          {layout === 'board' ? (
            <TaskBoard projectId={projectId} tasks={stageTasks} />
          ) : (
            <TaskListGrouped stages={stages} tasks={tasks} />
          )}
        </section>
      </div>
      <TaskDetailsModal task={tasks.find((t) => t.id === openTaskId) ?? null} />
    </div>
    </ProjectEditableContext.Provider>
  );
}
