import { useMutation, useQuery, useQueryClient, type QueryKey } from '@tanstack/react-query';
import { ideasApi } from '../api/endpoints';
import type { ApproveIdeaInput, ChangeIdeaStatusInput, CreateIdeaInput, ListIdeasQuery } from '../api/types';
import { useUI } from '../store/ui';
import { queryKeys } from './keys';

function useInvalidateIdeas({ withTasks = false } = {}) {
  const queryClient = useQueryClient();
  return () => {
    const keys: QueryKey[] = [queryKeys.ideas.all, queryKeys.activity.all];
    if (withTasks) keys.push(queryKeys.tasks.all, queryKeys.projects.all);
    return Promise.all(keys.map((queryKey) => queryClient.invalidateQueries({ queryKey })));
  };
}

export function useIdeas(query: ListIdeasQuery = {}) {
  return useQuery({
    queryKey: queryKeys.ideas.list(query),
    queryFn: ({ signal }) => ideasApi.list(query, signal),
  });
}

export function useCreateIdea() {
  const invalidate = useInvalidateIdeas();
  return useMutation({
    mutationFn: (input: CreateIdeaInput) => ideasApi.create(input),
    onSettled: invalidate,
    meta: { silentError: true },
  });
}

export function useIdeaFeedback() {
  const invalidate = useInvalidateIdeas();
  const toast = useUI((s) => s.toast);
  return useMutation({
    mutationFn: ({ ideaId, feedback }: { ideaId: string; feedback: string }) => ideasApi.feedback(ideaId, feedback),
    onSuccess: () => toast('Parecer registrado'),
    onSettled: invalidate,
  });
}

/** Na API, aprovar = criar a task vinculada à etapa, numa única transação. */
export function useApproveIdea() {
  const invalidate = useInvalidateIdeas({ withTasks: true });
  const toast = useUI((s) => s.toast);
  return useMutation({
    mutationFn: ({ ideaId, input }: { ideaId: string; input: ApproveIdeaInput }) => ideasApi.approve(ideaId, input),
    onSuccess: ({ task }) => toast('Ideia convertida em task', `Adicionada à fila da etapa "${task.stageTitle}".`),
    onSettled: invalidate,
  });
}

export function useChangeIdeaStatus() {
  const invalidate = useInvalidateIdeas();
  return useMutation({
    mutationFn: ({ ideaId, input }: { ideaId: string; input: ChangeIdeaStatusInput }) =>
      ideasApi.changeStatus(ideaId, input),
    onSettled: invalidate,
  });
}
