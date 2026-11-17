import { ActivityFeed } from '../components/dashboard/ActivityFeed';
import { EngineerQueuePanel } from '../components/dashboard/EngineerQueuePanel';
import { KpiCards } from '../components/dashboard/KpiCards';
import { ManagerRequestsPanel } from '../components/dashboard/ManagerRequestsPanel';
import { ProjectRoadmap } from '../components/dashboard/ProjectRoadmap';
import { ErrorState, PageLoader } from '../components/ui/States';
import { firstName, formatLongDate, greeting } from '../lib/utils';
import { useIdeas } from '../queries/ideas';
import { useProjectDetails, useProjects } from '../queries/projects';
import { useCurrentUser } from '../store/session';

export function DashboardView() {
  const user = useCurrentUser();
  const projects = useProjects();
  const ideas = useIdeas();
  const details = useProjectDetails(projects.data?.map((p) => p.id) ?? []);
  const isManager = user.role !== 'ENGINEER';

  return (
    <div className="mx-auto max-w-[1400px] space-y-6 p-4 md:p-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-zinc-500">
            {greeting()}, {firstName(user.name)}
          </p>
          <h1 className="mt-0.5 text-2xl font-semibold tracking-tight text-zinc-950">
            {user.role === 'COLLABORATOR'
              ? 'Acompanhe os projetos da empresa'
              : isManager
                ? 'Panorama executivo dos projetos'
                : 'Centro de controle operacional'}
          </h1>
        </div>
        <p className="text-xs text-zinc-500 first-letter:uppercase">{formatLongDate()}</p>
      </div>

      {projects.isPending && <PageLoader label="Carregando projetos…" />}
      {projects.isError && <ErrorState error={projects.error} onRetry={() => void projects.refetch()} />}

      {projects.data && (
        <>
          <KpiCards projects={projects.data} details={details} ideas={ideas.data} />

          <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
            <ProjectRoadmap projects={projects.data} details={details} />
            <div className="space-y-6">
              {isManager ? <ManagerRequestsPanel ideas={ideas.data} /> : <EngineerQueuePanel ideas={ideas.data} />}
              <ActivityFeed />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
