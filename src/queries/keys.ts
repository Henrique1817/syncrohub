import type { ListActivityQuery, ListIdeasQuery, UserRole } from '../api/types';

/**
 * Chaves hierárquicas: invalidar `['tasks']` invalida também `['tasks', 'project', id]`, etc.
 * Centralizar aqui evita strings soltas espalhadas pelos componentes.
 */
export const queryKeys = {
  me: ['auth', 'me'] as const,
  invitation: (token: string) => ['auth', 'invitation', token] as const,
  team: ['team', 'members'] as const,
  users: (role?: UserRole) => ['users', role ?? 'all'] as const,
  projects: {
    all: ['projects'] as const,
    list: (archived = false) => ['projects', 'list', archived ? 'archived' : 'active'] as const,
    detail: (projectId: string) => ['projects', 'detail', projectId] as const,
  },
  tasks: {
    all: ['tasks'] as const,
    byProject: (projectId: string) => ['tasks', 'project', projectId] as const,
    triage: () => ['tasks', 'triage'] as const,
    detail: (taskId: string) => ['tasks', 'detail', taskId] as const,
  },
  ideas: {
    all: ['ideas'] as const,
    list: (query: ListIdeasQuery = {}) => ['ideas', 'list', query] as const,
  },
  activity: {
    all: ['activity'] as const,
    list: (query: ListActivityQuery = {}) => ['activity', query] as const,
  },
};
