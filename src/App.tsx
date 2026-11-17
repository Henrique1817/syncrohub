import { useEffect, useRef } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { Topbar } from './components/layout/Topbar';
import { NewRequestModal } from './components/modals/NewRequestModal';
import { ProjectFormModal } from './components/projects/ProjectFormModal';
import { Toaster } from './components/ui/Toaster';
import { useSessionSync } from './queries/auth';
import { useSession } from './store/session';
import { useUI } from './store/ui';
import { AcceptInviteView } from './views/AcceptInviteView';
import { DashboardView } from './views/DashboardView';
import { IdeasView } from './views/IdeasView';
import { LoginView } from './views/LoginView';
import { ProjectView } from './views/ProjectView';
import { TeamView } from './views/TeamView';

function AuthenticatedApp() {
  const view = useUI((s) => s.view);
  const mainRef = useRef<HTMLElement>(null);
  useSessionSync();

  // `main` é o container com rolagem: sem isso a nova tela abriria na altura da anterior.
  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0 });
  }, [view]);

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-50">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <main ref={mainRef} className="flex-1 scroll-pt-20 overflow-y-auto">
          <Topbar />
          {view.name === 'dashboard' && <DashboardView />}
          {view.name === 'project' && <ProjectView key={view.projectId} projectId={view.projectId} />}
          {view.name === 'ideas' && <IdeasView />}
          {view.name === 'team' && <TeamView />}
        </main>
      </div>
      <NewRequestModal />
      <ProjectFormModal />
    </div>
  );
}

export default function App() {
  const isAuthenticated = useSession((s) => Boolean(s.token && s.user));
  const view = useUI((s) => s.view);

  return (
    <>
      {view.name === 'invite' ? (
        <AcceptInviteView key={view.token} token={view.token} />
      ) : isAuthenticated ? (
        <AuthenticatedApp />
      ) : (
        <LoginView />
      )}
      <Toaster />
    </>
  );
}
