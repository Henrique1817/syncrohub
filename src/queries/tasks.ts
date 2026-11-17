import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { tasksApi } from '../api/endpoints';
import type { CreateTaskInput, Task, TaskStatus, TriageTaskInput, UpdateTaskInput } from '../api/types';
import { useUI } from '../store/ui';
import { queryKeys } from './keys';

/** Mudanças em tasks afetam contadores do projeto, a timeline e (via ideias convertidas) a central de ideias. */
function useInvalidateAfterTaskChange() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all(
      [queryKeys.tasks.all, queryKeys.projects.all, queryKeys.activity.all, queryKeys.ideas.all].map((queryKey) =>
        queryClient.invalidateQueries({ queryKey }),
      ),
    );
}

export function useProjectTasks(projectId: string) {
  return useQuery({
    queryKey: queryKeys.tasks.byProject(projectId),
    queryFn: ({ signal }) => tasksApi.listByProject(projectId, undefined, signal),
  });
}

export function useTriageQueue() {
  return useQuery({
    queryKey: queryKeys.tasks.triage(),
    queryFn: ({ signal }) => tasksApi.triageQueue(undefined, signal),
  });
}

export function useTask(taskId: string | null) {
  return useQuery({
    queryKey: queryKeys.tasks.detail(taskId ?? ''),
    queryFn: ({ signal }) => tasksApi.get(taskId!, signal),
    enabled: Boolean(taskId),
  });
}

export function useCreateTask() {
  const invalidate = useInvalidateAfterTaskChange();
  return useMutation({
    mutationFn: ({ projectId, input }: { projectId: string; input: CreateTaskInput }) =>
      tasksApi.create(projectId, input),
    onSettled: invalidate,
    meta: { silentError: true },
  });
}

export function useUpdateTask() {
  const invalidate = useInvalidateAfterTaskChange();
  return useMutation({
    mutationFn: ({ taskId, input }: { taskId: string; input: UpdateTaskInput }) => tasksApi.update(taskId, input),
    onSettled: invalidate,
    meta: { silentError: true },
  });
}

export function useTriageTask() {
  const invalidate = useInvalidateAfterTaskChange();
  const toast = useUI((s) => s.toast);
  return useMutation({
    mutationFn: ({ taskId, input }: { taskId: string; input: TriageTaskInput }) => tasksApi.triage(taskId, input),
    onSuccess: (task) => toast('Demanda triada', `Entrou na fila da etapa "${task.stageTitle}".`),
    onSettled: invalidate,
  });
}

/** Otimista: o card muda de coluna no drop; se a API falhar, volta para a coluna original. */
export function useChangeTaskStatus(projectId: string) {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateAfterTaskChange();
  const toast = useUI((s) => s.toast);
  const listKey = queryKeys.tasks.byProject(projectId);

  return useMutation({
    mutationFn: ({ taskId, status }: { taskId: string; status: TaskStatus }) => tasksApi.changeStatus(taskId, status),
    onMutate: async ({ taskId, status }) => {
      await queryClient.cancelQueries({ queryKey: listKey });
      const previous = queryClient.getQueryData<Task[]>(listKey);
      queryClient.setQueryData<Task[]>(listKey, (tasks) =>
        tasks?.map((task) => (task.id === taskId ? { ...task, status } : task)),
      );
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(listKey, context.previous);
    },
    onSuccess: (task) => {
      if (task.ideaId && task.status === 'DONE') {
        toast('Ideia marcada como implementada', `"${task.title}" foi entregue.`);
      }
    },
    onSettled: invalidate,
  });
}
