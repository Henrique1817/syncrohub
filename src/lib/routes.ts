import type { View } from '../types';

export function viewToPath(view: View): string {
  switch (view.name) {
    case 'dashboard':
      return '/';
    case 'ideas':
      return '/ideias';
    case 'team':
      return '/equipe';
    case 'project':
      return `/projetos/${encodeURIComponent(view.projectId)}`;
    case 'invite':
      return `/convite/${encodeURIComponent(view.token)}`;
  }
}

/** Caminhos desconhecidos caem na visão geral. */
export function pathToView(pathname: string): View {
  const project = pathname.match(/^\/projetos\/([^/]+)\/?$/);
  if (project) return { name: 'project', projectId: decodeURIComponent(project[1]) };
  const invite = pathname.match(/^\/convite\/([^/]+)\/?$/);
  if (invite) return { name: 'invite', token: decodeURIComponent(invite[1]) };
  if (/^\/ideias\/?$/.test(pathname)) return { name: 'ideas' };
  if (/^\/equipe\/?$/.test(pathname)) return { name: 'team' };
  return { name: 'dashboard' };
}
