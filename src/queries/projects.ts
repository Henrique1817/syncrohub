import {
  queryOptions,
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
  type QueryKey,
  type UseQueryResult,
} from '@tanstack/react-query';
import { githubApi, projectsApi, usersApi } from '../api/endpoints';
import type { CreateProjectInput, ProjectDetail, UpdateProjectInput, UserRole } from '../api/types';
import { queryKeys } from './keys';

export const projectDetailQuery = (projectId: string) =>
  queryOptions({
    queryKey: queryKeys.projects.detail(projectId),
    queryFn: ({ signal }) => projectsApi.get(projectId, signal),
  });

export function useProjects() {
  return useQuery({
    queryKey: queryKeys.projects.list(),
    queryFn: ({ signal }) => projectsApi.list({}, signal),
  });
}

export function useArchivedProjects() {
  return useQuery({
    queryKey: queryKeys.projects.list(true),
    queryFn: ({ signal }) => projectsApi.list({ archived: true }, signal),
  });
}

export function useProject(projectId: string | undefined) {
  return useQuery({ ...projectDetailQuery(projectId ?? ''), enabled: Boolean(projectId) });
}

function indexById(results: UseQueryResult<ProjectDetail>[]) {
  const byId: Record<string, ProjectDetail> = {};
  for (const { data } of results) if (data) byId[data.id] = data;
  return byId;
}

/**
 * GET /projects não traz a lista de etapas, só a etapa atual. Para desenhar o stepper de cada
 * projeto no dashboard buscamos os detalhes em paralelo (o cache é compartilhado com a tela do projeto).
 */
export function useProjectDetails(projectIds: string[]) {
  return useQueries({ queries: projectIds.map(projectDetailQuery), combine: indexById });
}

export function useUsers(role?: UserRole) {
  return useQuery({
    queryKey: queryKeys.users(role),
    queryFn: ({ signal }) => usersApi.list(role, signal),
    staleTime: 5 * 60_000,
  });
}

function useInvalidate(keys: QueryKey[]) {
  const queryClient = useQueryClient();
  return () => Promise.all(keys.map((queryKey) => queryClient.invalidateQueries({ queryKey })));
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  const invalidate = useInvalidate([queryKeys.projects.all, queryKeys.activity.all]);

  return useMutation({
    mutationFn: (input: CreateProjectInput) => projectsApi.create(input),
    onSuccess: (project) => queryClient.setQueryData(queryKeys.projects.detail(project.id), project),
    onSettled: invalidate,
    meta: { silentError: true },
  });
}

export function useUpdateProject(projectId: string) {
  const queryClient = useQueryClient();
  const invalidate = useInvalidate([queryKeys.projects.all, queryKeys.activity.all]);

  return useMutation({
    mutationFn: (input: UpdateProjectInput) => projectsApi.update(projectId, input),
    onSuccess: (project) => queryClient.setQueryData(queryKeys.projects.detail(projectId), project),
    onSettled: invalidate,
    meta: { silentError: true },
  });
}

/** Arquivar/restaurar também muda a fila de triagem: demandas de projetos arquivados saem dela. */
function useSetArchived(projectId: string, archived: boolean) {
  const queryClient = useQueryClient();
  const invalidate = useInvalidate([queryKeys.projects.all, queryKeys.activity.all, queryKeys.tasks.triage()]);

  return useMutation({
    mutationFn: () => (archived ? projectsApi.archive(projectId) : projectsApi.restore(projectId)),
    onSuccess: (project) => queryClient.setQueryData(queryKeys.projects.detail(projectId), project),
    onSettled: invalidate,
    meta: { silentError: true },
  });
}

export const useArchiveProject = (projectId: string) => useSetArchived(projectId, true);
export const useRestoreProject = (projectId: string) => useSetArchived(projectId, false);

/** Exclusão em cascata no banco: etapas, tasks e comentários do projeto somem; ideias ficam sem projeto. */
export function useDeleteProject(projectId: string) {
  const queryClient = useQueryClient();
  const invalidate = useInvalidate([queryKeys.projects.all, queryKeys.activity.all, queryKeys.ideas.all]);

  return useMutation({
    mutationFn: () => projectsApi.remove(projectId),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: queryKeys.projects.detail(projectId) });
      queryClient.removeQueries({ queryKey: queryKeys.tasks.byProject(projectId) });
    },
    onSettled: invalidate,
    meta: { silentError: true },
  });
}

export function usePreviewGitHubRepo() {
  return useMutation({
    mutationFn: ({ repo, token }: { repo: string; token?: string }) => githubApi.preview(repo, token),
    meta: { silentError: true },
  });
}

export function useSyncProjectGitHub(projectId: string) {
  const invalidate = useInvalidate([
    queryKeys.projects.detail(projectId),
    queryKeys.projects.all,
    queryKeys.tasks.byProject(projectId),
    queryKeys.activity.all,
  ]);

  return useMutation({
    mutationFn: (token?: string) => githubApi.syncProject(projectId, token),
    onSettled: invalidate,
    meta: { silentError: true },
  });
}
