import { pool } from '../../infra/db/pool.js';
import type { Queryable } from '../../infra/db/pool.js';
import { withTransaction } from '../../infra/db/transaction.js';
import type { AuthUser } from '../../shared/domain/auth.js';
import { STAGE_STATUS_LABEL } from '../../shared/domain/labels.js';
import { notFound, unprocessable } from '../../shared/errors/app-error.js';
import { recordActivity } from '../activity/activity.service.js';
import * as projectsRepository from '../projects/projects.repository.js';
import { classifyStageTransition } from './stages.domain.js';
import * as stagesRepository from './stages.repository.js';
import type {
  ChangeStageStatusInput,
  CreateStageInput,
  ReorderStagesInput,
  UpdateStageInput,
} from './stages.schemas.js';
import type { Stage, StageStatusChangeResult } from './stages.types.js';

/** Usado por tasks/ideas/comments para garantir que a etapa pertence ao projeto informado. */
export async function requireStageInProject(db: Queryable, projectId: string, stageId: string): Promise<Stage> {
  const stage = await stagesRepository.findInProject(db, projectId, stageId);
  if (!stage) throw unprocessable('A etapa informada não pertence a este projeto.');
  return stage;
}

async function lockProjectOrFail(db: Queryable, projectId: string) {
  const project = await projectsRepository.lockById(db, projectId);
  if (!project) throw notFound('Projeto não encontrado.');
  return project;
}

/** Trava projeto → etapa (ordem fixa de locks) e devolve a etapa já atualizada. */
async function lockStageOrFail(db: Queryable, stageId: string): Promise<Stage> {
  const ref = await stagesRepository.findById(db, stageId);
  if (!ref) throw notFound('Etapa não encontrada.');
  await lockProjectOrFail(db, ref.projectId);
  const stage = await stagesRepository.findByIdForUpdate(db, stageId);
  if (!stage) throw notFound('Etapa não encontrada.');
  return stage;
}

export async function listStages(projectId: string) {
  const project = await projectsRepository.findById(pool, projectId);
  if (!project) throw notFound('Projeto não encontrado.');
  return stagesRepository.listByProject(pool, projectId);
}

export function createStage(user: AuthUser, projectId: string, input: CreateStageInput) {
  return withTransaction(async (tx) => {
    await lockProjectOrFail(tx, projectId);
    const stage = await stagesRepository.insert(tx, projectId, input);

    await recordActivity(tx, {
      projectId,
      userId: user.id,
      actionType: 'STAGE_CREATED',
      description: `Etapa "${stage.title}" adicionada ao roadmap`,
      metadata: { stageId: stage.id, orderIndex: stage.orderIndex },
    });
    return stage;
  });
}

export function updateStage(user: AuthUser, stageId: string, patch: UpdateStageInput) {
  return withTransaction(async (tx) => {
    const current = await lockStageOrFail(tx, stageId);
    const stage = (await stagesRepository.update(tx, stageId, patch))!;

    await recordActivity(tx, {
      projectId: stage.projectId,
      userId: user.id,
      actionType: 'STAGE_UPDATED',
      description: `Etapa "${stage.title}" atualizada`,
      metadata: {
        stageId,
        changes: Object.keys(patch).filter((key) => patch[key as keyof UpdateStageInput] !== undefined),
        ...(patch.dueDate !== undefined && { previousDueDate: current.dueDate, dueDate: stage.dueDate }),
      },
    });
    return stage;
  });
}

export function changeStageStatus(
  user: AuthUser,
  stageId: string,
  input: ChangeStageStatusInput,
): Promise<StageStatusChangeResult> {
  return withTransaction(async (tx) => {
    const current = await lockStageOrFail(tx, stageId);
    const transition = classifyStageTransition(current.status, input.status);

    if (transition === 'NONE') {
      return {
        stage: current,
        activatedStage: null,
        projectProgress: await projectsRepository.getProgress(tx, current.projectId),
      };
    }

    const stage = await stagesRepository.updateStatus(tx, stageId, input.status);
    await recordActivity(tx, {
      projectId: stage.projectId,
      userId: user.id,
      actionType: transition === 'ADVANCE' ? 'STAGE_ADVANCED' : 'STAGE_REVERTED',
      description: `Etapa "${stage.title}": ${STAGE_STATUS_LABEL[current.status]} → ${STAGE_STATUS_LABEL[stage.status]}`,
      metadata: { stageId, from: current.status, to: stage.status, automatic: false },
    });

    let activatedStage: Stage | null = null;
    if (stage.status === 'DONE' && input.activateNext && !(await stagesRepository.hasActiveStage(tx, stage.projectId))) {
      const next = await stagesRepository.findNextPendingForUpdate(tx, stage.projectId, stage.orderIndex);
      if (next) {
        activatedStage = await stagesRepository.updateStatus(tx, next.id, 'ACTIVE');
        await recordActivity(tx, {
          projectId: stage.projectId,
          userId: user.id,
          actionType: 'STAGE_ADVANCED',
          description: `Etapa "${next.title}" iniciada após a conclusão de "${stage.title}"`,
          metadata: { stageId: next.id, from: 'PENDING', to: 'ACTIVE', automatic: true, triggeredBy: stageId },
        });
      }
    }

    return {
      stage,
      activatedStage,
      projectProgress: await projectsRepository.getProgress(tx, stage.projectId),
    };
  });
}

export function reorderStages(user: AuthUser, projectId: string, { stageIds }: ReorderStagesInput) {
  return withTransaction(async (tx) => {
    await lockProjectOrFail(tx, projectId);

    const existing = new Set(await stagesRepository.listIds(tx, projectId));
    const sameSet = existing.size === stageIds.length && stageIds.every((id) => existing.has(id));
    if (!sameSet) throw unprocessable('Envie exatamente todas as etapas do projeto, na nova ordem.');

    await stagesRepository.reorder(tx, projectId, stageIds);
    await recordActivity(tx, {
      projectId,
      userId: user.id,
      actionType: 'STAGE_REORDERED',
      description: 'Ordem das etapas do roadmap atualizada',
      metadata: { stageIds },
    });

    return stagesRepository.listByProject(tx, projectId);
  });
}

export function deleteStage(user: AuthUser, stageId: string) {
  return withTransaction(async (tx) => {
    const stage = await lockStageOrFail(tx, stageId);
    const detachedTasks = await stagesRepository.countTasks(tx, stageId);

    await stagesRepository.remove(tx, stageId);
    await recordActivity(tx, {
      projectId: stage.projectId,
      userId: user.id,
      actionType: 'STAGE_DELETED',
      description: `Etapa "${stage.title}" removida do roadmap`,
      metadata: { stageId, title: stage.title, detachedTasks },
    });
  });
}
