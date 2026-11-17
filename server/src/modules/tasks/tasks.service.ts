import { pool } from '../../infra/db/pool.js';
import type { Queryable } from '../../infra/db/pool.js';
import { withTransaction } from '../../infra/db/transaction.js';
import type { AuthUser } from '../../shared/domain/auth.js';
import { TASK_STATUS_LABEL } from '../../shared/domain/labels.js';
import { conflict, notFound, unprocessable } from '../../shared/errors/app-error.js';
import { recordActivity } from '../activity/activity.service.js';
import * as ideasRepository from '../ideas/ideas.repository.js';
import * as projectsRepository from '../projects/projects.repository.js';
import { assertNotArchived } from '../projects/projects.service.js';
import { requireStageInProject } from '../stages/stages.service.js';
import * as tasksRepository from './tasks.repository.js';
import { DATE_RANGE_MESSAGE } from './tasks.schemas.js';
import type {
  ChangeTaskStatusInput,
  CreateTaskInput,
  ListTasksQuery,
  TriageQueueQuery,
  TriageTaskInput,
  UpdateTaskInput,
} from './tasks.schemas.js';
import type { Task } from './tasks.types.js';

async function getTaskOrFail(db: Queryable, taskId: string): Promise<Task> {
  const task = await tasksRepository.findById(db, taskId);
  if (!task) throw notFound('Task não encontrada.');
  return task;
}

async function lockTaskOrFail(db: Queryable, taskId: string): Promise<Task> {
  const task = await tasksRepository.findByIdForUpdate(db, taskId);
  if (!task) throw notFound('Task não encontrada.');
  return task;
}

export async function listProjectTasks(projectId: string, query: ListTasksQuery) {
  const project = await projectsRepository.findById(pool, projectId);
  if (!project) throw notFound('Projeto não encontrado.');
  return tasksRepository.listByProject(pool, projectId, query);
}

export function listTriageQueue(query: TriageQueueQuery) {
  return tasksRepository.listTriageQueue(pool, query);
}

export function getTask(taskId: string) {
  return getTaskOrFail(pool, taskId);
}

export async function createTask(user: AuthUser, projectId: string, input: CreateTaskInput) {
  const isManagerRequest = user.role === 'MANAGER';

  const taskId = await withTransaction(async (tx) => {
    const project = await projectsRepository.findById(tx, projectId);
    if (!project) throw notFound('Projeto não encontrado.');
    assertNotArchived(project);
    const stage = input.stageId ? await requireStageInProject(tx, projectId, input.stageId) : null;

    const id = await tasksRepository.insert(tx, {
      projectId,
      stageId: stage?.id ?? null,
      ideaId: null,
      title: input.title,
      description: input.description ?? null,
      priority: input.priority,
      status: isManagerRequest ? 'BACKLOG' : (input.status ?? 'TODO'),
      source: isManagerRequest ? 'MANAGER_REQUEST' : 'ENGINEER',
      createdBy: user.id,
      assignedTo: isManagerRequest ? null : (input.assignedTo ?? user.id),
      triaged: !isManagerRequest,
      startDate: input.startDate ?? null,
      dueDate: input.dueDate ?? null,
    });

    await recordActivity(tx, {
      projectId,
      userId: user.id,
      actionType: 'TASK_CREATED',
      description: isManagerRequest
        ? `${user.name} solicitou "${input.title}" (aguardando triagem)`
        : `Task "${input.title}" criada${stage ? ` na etapa "${stage.title}"` : ''}`,
      metadata: { taskId: id, priority: input.priority, stageId: stage?.id ?? null, managerRequest: isManagerRequest },
    });
    return id;
  });

  return getTaskOrFail(pool, taskId);
}

/** ENGINEER aceita uma demanda em triagem e a vincula a uma etapa do projeto. */
export async function triageTask(user: AuthUser, taskId: string, input: TriageTaskInput) {
  await withTransaction(async (tx) => {
    const task = await lockTaskOrFail(tx, taskId);
    if (task.status !== 'BACKLOG') throw conflict('Esta task já foi triada.');

    const stage = await requireStageInProject(tx, task.projectId, input.stageId);
    await tasksRepository.triage(tx, taskId, {
      stageId: stage.id,
      priority: input.priority,
      assignedTo: input.assignedTo ?? task.assignedTo ?? user.id,
      status: input.status,
    });

    await recordActivity(tx, {
      projectId: task.projectId,
      userId: user.id,
      actionType: 'TASK_TRIAGED',
      description: `Demanda "${task.title}" aceita e vinculada à etapa "${stage.title}"`,
      metadata: {
        taskId,
        stageId: stage.id,
        requestedBy: task.createdBy,
        priority: input.priority ?? task.priority,
        status: input.status,
      },
    });
  });

  return getTaskOrFail(pool, taskId);
}

export async function updateTask(user: AuthUser, taskId: string, patch: UpdateTaskInput) {
  await withTransaction(async (tx) => {
    const task = await lockTaskOrFail(tx, taskId);
    if (patch.stageId) await requireStageInProject(tx, task.projectId, patch.stageId);

    // O schema só valida o par quando os dois vêm no patch; aqui comparamos com o valor já salvo.
    const startDate = patch.startDate !== undefined ? patch.startDate : task.startDate;
    const dueDate = patch.dueDate !== undefined ? patch.dueDate : task.dueDate;
    if (startDate && dueDate && startDate > dueDate) throw unprocessable(DATE_RANGE_MESSAGE);

    await tasksRepository.update(tx, taskId, patch);
    await recordActivity(tx, {
      projectId: task.projectId,
      userId: user.id,
      actionType: 'TASK_UPDATED',
      description: `Task "${patch.title ?? task.title}" atualizada`,
      metadata: { taskId, changes: Object.keys(patch) },
    });
  });

  return getTaskOrFail(pool, taskId);
}

export async function changeTaskStatus(user: AuthUser, taskId: string, { status }: ChangeTaskStatusInput) {
  await withTransaction(async (tx) => {
    const task = await lockTaskOrFail(tx, taskId);
    if (task.status === status) return;

    await tasksRepository.updateStatus(tx, taskId, status);
    await recordActivity(tx, {
      projectId: task.projectId,
      userId: user.id,
      actionType: 'TASK_STATUS_CHANGED',
      description: `Task "${task.title}": ${TASK_STATUS_LABEL[task.status]} → ${TASK_STATUS_LABEL[status]}`,
      metadata: { taskId, stageId: task.stageId, from: task.status, to: status },
    });

    if (status === 'DONE' && task.ideaId && (await ideasRepository.markImplemented(tx, task.ideaId))) {
      await recordActivity(tx, {
        projectId: task.projectId,
        userId: user.id,
        actionType: 'IDEA_STATUS_CHANGED',
        description: `Ideia "${task.title}" implementada`,
        metadata: { ideaId: task.ideaId, taskId, from: 'APPROVED', to: 'IMPLEMENTED', automatic: true },
      });
    }
  });

  return getTaskOrFail(pool, taskId);
}

export function deleteTask(user: AuthUser, taskId: string) {
  return withTransaction(async (tx) => {
    const task = await lockTaskOrFail(tx, taskId);
    await tasksRepository.remove(tx, taskId);
    await recordActivity(tx, {
      projectId: task.projectId,
      userId: user.id,
      actionType: 'TASK_DELETED',
      description: `Task "${task.title}" removida`,
      metadata: { taskId, title: task.title },
    });
  });
}
