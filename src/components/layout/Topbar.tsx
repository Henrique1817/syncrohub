import { Briefcase, ChevronRight, FolderPlus, Lightbulb, Plus, UserRound, Wrench } from 'lucide-react';
import { ROLE_META } from '../../lib/constants';
import { canCreateTasks } from '../../lib/permissions';
import { cn } from '../../lib/utils';
import { useProject } from '../../queries/projects';
import { useCurrentUser } from '../../store/session';
import { useUI } from '../../store/ui';
import { Button } from '../ui/Button';

const ROLE_ICON = { ENGINEER: Wrench, MANAGER: Briefcase, COLLABORATOR: UserRound } as const;

export function Topbar() {
  const view = useUI((s) => s.view);
  const openModal = useUI((s) => s.openModal);
  const openProjectForm = useUI((s) => s.openProjectForm);
  const navigate = useUI((s) => s.navigate);
  const user = useCurrentUser();
  const projectId = view.name === 'project' ? view.projectId : undefined;
  const project = useProject(projectId);
  const context = projectId && !project.data?.archivedAt ? { projectId } : undefined;
  const isEngineer = user.role === 'ENGINEER';
  const RoleIcon = ROLE_ICON[user.role];

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-4 border-b border-zinc-200 bg-white/95 px-4 backdrop-blur md:px-6">
      <nav className="flex min-w-0 items-center gap-1.5 text-sm">
        <button onClick={() => navigate({ name: 'dashboard' })} className="text-zinc-400 transition hover:text-zinc-700">
          SyncroHub
        </button>
        <ChevronRight className="h-3.5 w-3.5 shrink-0 text-zinc-300" />
        <span className="truncate font-medium text-zinc-900">
          {view.name === 'dashboard' && 'Visão geral'}
          {view.name === 'ideas' && 'Ideias & Sugestões'}
          {view.name === 'team' && 'Equipe'}
          {view.name === 'project' && (project.data?.name ?? 'Projeto')}
        </span>
      </nav>

      <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
        <span
          className={cn(
            'hidden items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium sm:inline-flex',
            isEngineer ? 'bg-zinc-900 text-white' : user.role === 'MANAGER' ? 'bg-indigo-50 text-indigo-700' : 'bg-sky-50 text-sky-700',
          )}
        >
          <RoleIcon className="h-3.5 w-3.5" />
          {ROLE_META[user.role].label}
        </span>
        <div className="hidden h-6 w-px bg-zinc-200 sm:block" />
        {isEngineer ? (
          <>
            <Button variant="secondary" icon={FolderPlus} aria-label="Novo projeto" onClick={() => openProjectForm()}>
              <span className="hidden xl:inline">Novo projeto</span>
            </Button>
            <Button icon={Plus} aria-label="Nova task" onClick={() => openModal('TASK', context)}>
              <span className="hidden lg:inline">Nova task</span>
            </Button>
          </>
        ) : (
          <>
            <Button
              variant={canCreateTasks(user.role) ? 'secondary' : 'primary'}
              icon={Lightbulb}
              aria-label="Enviar ideia"
              onClick={() => openModal('IDEA', context)}
            >
              <span className={canCreateTasks(user.role) ? 'hidden xl:inline' : 'hidden lg:inline'}>Enviar ideia</span>
            </Button>
            {canCreateTasks(user.role) && (
              <Button icon={Plus} aria-label="Nova demanda" onClick={() => openModal('TASK', context)}>
                <span className="hidden lg:inline">Nova demanda</span>
              </Button>
            )}
          </>
        )}
      </div>
    </header>
  );
}
