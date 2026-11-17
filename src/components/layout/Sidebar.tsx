import { useState } from 'react';
import { Archive, ChevronRight, LayoutDashboard, Lightbulb, LogOut, Plus, Users, Workflow, type LucideIcon } from 'lucide-react';
import { DEPARTMENT_META, PROJECT_STATUS_META, ROLE_META } from '../../lib/constants';
import { canManageTeam } from '../../lib/permissions';
import { cn } from '../../lib/utils';
import { useIdeas } from '../../queries/ideas';
import { useArchivedProjects, useProjects } from '../../queries/projects';
import { useCurrentUser, useSession } from '../../store/session';
import { useUI } from '../../store/ui';
import type { View } from '../../types';
import { AppLink } from '../ui/AppLink';
import { Avatar } from '../ui/Avatar';
import { Skeleton } from '../ui/States';

interface NavItemProps {
  icon: LucideIcon;
  label: string;
  active: boolean;
  badge?: number;
  to: View;
}

function NavItem({ icon: Icon, label, active, badge, to }: NavItemProps) {
  return (
    <AppLink
      to={to}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition',
        active ? 'bg-zinc-100 font-medium text-zinc-900' : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900',
      )}
    >
      <Icon className={cn('h-4 w-4', active ? 'text-zinc-900' : 'text-zinc-400')} />
      <span className="flex-1 text-left">{label}</span>
      {!!badge && (
        <span className="rounded-full bg-indigo-600 px-1.5 text-[10px] leading-4 font-semibold text-white tabular-nums">
          {badge}
        </span>
      )}
    </AppLink>
  );
}

export function Sidebar() {
  const view = useUI((s) => s.view);
  const openProjectForm = useUI((s) => s.openProjectForm);
  const logout = useSession((s) => s.logout);
  const user = useCurrentUser();
  const projects = useProjects();
  const archived = useArchivedProjects();
  const ideas = useIdeas();
  const [showArchived, setShowArchived] = useState(false);

  const ideasBadge = (ideas.data ?? []).filter((idea) =>
    user.role === 'ENGINEER'
      ? idea.status === 'UNDER_REVIEW' && !idea.engineerFeedback
      : idea.authorId === user.id && idea.engineerFeedback && idea.status === 'UNDER_REVIEW',
  ).length;

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-zinc-200 bg-white md:flex">
      <div className="flex h-14 items-center gap-2.5 border-b border-zinc-200 px-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-900 text-white">
          <Workflow className="h-4 w-4" />
        </div>
        <div className="leading-tight">
          <p className="text-sm font-semibold tracking-tight">SyncroHub</p>
          <p className="text-[11px] text-zinc-500">Portal de Projetos</p>
        </div>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto p-3">
        <div className="space-y-0.5">
          <NavItem
            icon={LayoutDashboard}
            label="Visão geral"
            active={view.name === 'dashboard'}
            to={{ name: 'dashboard' }}
          />
          <NavItem
            icon={Lightbulb}
            label="Ideias & Sugestões"
            active={view.name === 'ideas'}
            badge={ideasBadge}
            to={{ name: 'ideas' }}
          />
          {canManageTeam(user) && (
            <NavItem icon={Users} label="Equipe" active={view.name === 'team'} to={{ name: 'team' }} />
          )}
        </div>

        <div>
          <div className="flex items-center justify-between px-2 pb-1.5">
            <p className="text-[11px] font-medium tracking-wider text-zinc-400 uppercase">Projetos</p>
            {user.role === 'ENGINEER' && (
              <button
                onClick={() => openProjectForm()}
                className="rounded p-0.5 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700"
                aria-label="Novo projeto"
                title="Novo projeto"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <div className="space-y-0.5">
            {projects.isPending &&
              [0, 1, 2].map((i) => <Skeleton key={i} className="mx-2 my-2 h-4" />)}
            {projects.data?.map((project) => {
              const active = view.name === 'project' && view.projectId === project.id;
              return (
                <AppLink
                  key={project.id}
                  to={{ name: 'project', projectId: project.id }}
                  aria-current={active ? 'page' : undefined}
                  title={project.name}
                  className={cn(
                    'flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-sm transition',
                    active ? 'bg-zinc-100 font-medium text-zinc-900' : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900',
                  )}
                >
                  <span
                    className={cn(
                      'h-2 w-2 shrink-0 rounded-full',
                      project.overdueStages > 0 ? 'bg-amber-500' : PROJECT_STATUS_META[project.status].dot,
                    )}
                  />
                  <span className="min-w-0 flex-1 truncate">{project.name}</span>
                  <span className="text-[11px] text-zinc-400 tabular-nums">{project.progressPercentage}%</span>
                </AppLink>
              );
            })}
            {projects.data?.length === 0 && <p className="px-2 text-xs text-zinc-400">Nenhum projeto ainda.</p>}
          </div>
        </div>

        {!!archived.data?.length && (
          <div>
            <button
              onClick={() => setShowArchived((open) => !open)}
              aria-expanded={showArchived}
              className="flex w-full items-center gap-1.5 px-2 pb-1.5 text-[11px] font-medium tracking-wider text-zinc-400 uppercase transition hover:text-zinc-600"
            >
              <ChevronRight className={cn('h-3 w-3 transition-transform', showArchived && 'rotate-90')} />
              Arquivados
              <span className="ml-auto font-normal tracking-normal tabular-nums">{archived.data.length}</span>
            </button>
            {showArchived && (
              <div className="space-y-0.5">
                {archived.data.map((project) => {
                  const active = view.name === 'project' && view.projectId === project.id;
                  return (
                    <AppLink
                      key={project.id}
                      to={{ name: 'project', projectId: project.id }}
                      aria-current={active ? 'page' : undefined}
                      title={project.name}
                      className={cn(
                        'flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-sm transition',
                        active ? 'bg-zinc-100 font-medium text-zinc-700' : 'text-zinc-400 hover:bg-zinc-50 hover:text-zinc-700',
                      )}
                    >
                      <Archive className="h-3.5 w-3.5 shrink-0" />
                      <span className="min-w-0 flex-1 truncate">{project.name}</span>
                    </AppLink>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </nav>

      <div className="border-t border-zinc-200 p-3">
        <div className="flex items-center gap-2.5 rounded-lg p-2">
          <Avatar name={user.name} seed={user.id} size="md" />
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-sm font-medium">{user.name}</p>
            <p className="truncate text-[11px] text-zinc-500">
              {user.positionTitle ?? (user.department ? DEPARTMENT_META[user.department].label : ROLE_META[user.role].label)}
            </p>
          </div>
          <button
            onClick={logout}
            className="rounded-md p-1.5 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700"
            aria-label="Sair"
            title="Sair"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
