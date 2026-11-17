import { useMutation, useQueryClient } from '@tanstack/react-query';
import { stagesApi } from '../api/endpoints';
import type { CreateStageInput, ProjectDetail, StageStatus, UpdateStageInput } from '../api/types';
import { useUI } from '../store/ui';
import { queryKeys } from './keys';

function useInvalidateProject() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all }),
      queryClient.invalidateQueries({ queryKey: queryKeys.activity.all }),
    ]);
}

export function useCreateStage(projectId: string) {
  const invalidate = useInvalidateProject();
  const toast = useUI((s) => s.toast);
  return useMutation({
    mutationFn: (input: CreateStageInput) => stagesApi.create(projectId, input),
    onSuccess: (stage) => toast('Etapa adicionada', stage.title),
    onSettled: invalidate,
  });
}

/** Otimista: a lista reordena na hora do drop e volta ao estado anterior se a API recusar. */
export function useReorderStages(projectId: string) {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateProject();
  const detailKey = queryKeys.projects.detail(projectId);

  return useMutation({
    mutationFn: (stageIds: string[]) => stagesApi.reorder(projectId, stageIds),
    onMutate: async (stageIds) => {
      await queryClient.cancelQueries({ queryKey: detailKey });
      const previous = queryClient.getQueryData<ProjectDetail>(detailKey);
      queryClient.setQueryData<ProjectDetail>(detailKey, (project) => {
        if (!project) return project;
        const byId = new Map(project.stages.map((stage) => [stage.id, stage]));
        return { ...project, stages: stageIds.map((id, index) => ({ ...byId.get(id)!, orderIndex: index })) };
      });
      return { previous };
    },
    onError: (_error, _stageIds, context) => {
      if (context?.previous) queryClient.setQueryData(detailKey, context.previous);
    },
    onSettled: invalidate,
  });
}

export function useUpdateStage() {
  const invalidate = useInvalidateProject();
  return useMutation({
    mutationFn: ({ stageId, input }: { stageId: string; input: UpdateStageInput }) => stagesApi.update(stageId, input),
    onSettled: invalidate,
    meta: { silentError: true },
  });
}

/** As tasks da etapa não são apagadas: ficam com stage_id nulo (FK ON DELETE SET NULL). */
export function useDeleteStage() {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateProject();
  return useMutation({
    mutationFn: (stageId: string) => stagesApi.remove(stageId),
    onSettled: () => Promise.all([invalidate(), queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all })]),
    meta: { silentError: true },
  });
}

export function useChangeStageStatus() {
  const invalidate = useInvalidateProject();
  const toast = useUI((s) => s.toast);
  return useMutation({
    mutationFn: ({ stageId, status }: { stageId: string; status: StageStatus }) => stagesApi.changeStatus(stageId, status),
    onSuccess: ({ stage, activatedStage, projectProgress }) => {
      toast(
        `Etapa "${stage.title}" atualizada`,
        activatedStage
          ? `"${activatedStage.title}" foi iniciada automaticamente · projeto em ${projectProgress}%`
          : `Projeto em ${projectProgress}%`,
      );
    },
    onSettled: invalidate,
  });
}
