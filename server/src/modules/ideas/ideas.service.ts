import { pool } from '../../infra/db/pool.js';
import type { Queryable } from '../../infra/db/pool.js';
import { withTransaction } from '../../infra/db/transaction.js';
import type { AuthUser } from '../../shared/domain/auth.js';
import { IDEA_STATUS_LABEL } from '../../shared/domain/labels.js';
import { conflict, notFound, unprocessable } from '../../shared/errors/app-error.js';
import { recordActivity } from '../activity/activity.service.js';
import * as projectsRepository from '../projects/projects.repository.js';
import { assertNotArchived } from '../projects/projects.service.js';
import { requireStageInProject } from '../stages/stages.service.js';
import * as tasksRepository from '../tasks/tasks.repository.js';
import type { Task } from '../tasks/tasks.types.js';
import * as ideasRepository from './ideas.repository.js';
import type {
  ApproveIdeaInput,
  ChangeIdeaStatusInput,
  CreateIdeaInput,
  IdeaFeedbackInput,
  ListIdeasQuery,
} from './ideas.schemas.js';
import type { Idea } from './ideas.types.js';

async function getIdeaOrFail(db: Queryable, ideaId: string): Promise<Idea> {
  const idea = await ideasRepository.findById(db, ideaId);
  if (!idea) throw notFound('Ideia/sugestão não encontrada.');
  return idea;
}

async function lockIdeaOrFail(db: Queryable, ideaId: string): Promise<Idea> {
  const idea = await ideasRepository.findByIdForUpdate(db, ideaId);
  if (!idea) throw notFound('Ideia/sugestão não encontrada.');
  return idea;
}

export function listIdeas(query: ListIdeasQuery) {
  return ideasRepository.list(pool, query);
}

export function getIdea(ideaId: string) {
  return getIdeaOrFail(pool, ideaId);
}

export async function submitIdea(user: AuthUser, input: CreateIdeaInput) {
  const ideaId = await withTransaction(async (tx) => {
    if (input.projectId) {
      const project = await projectsRepository.findById(tx, input.projectId);
      if (!project) throw notFound('Projeto não encontrado.');
      assertNotArchived(project);
    }

    const id = await ideasRepository.insert(tx, {
      projectId: input.projectId ?? null,
      authorId: user.id,
      category: input.category,
      title: input.title,
      content: input.content,
    });

    await recordActivity(tx, {
      projectId: input.projectId ?? null,
      userId: user.id,
      actionType: 'IDEA_SUBMITTED',
      description: `${user.name} enviou: "${input.title}"`,
      metadata: { ideaId: id, category: input.category },
    });
    return id;
  });

  return getIdeaOrFail(pool, ideaId);
}

export async function giveFeedback(user: AuthUser, ideaId: string, { feedback }: IdeaFeedbackInput) {
  await withTransaction(async (tx) => {
    const idea = await lockIdeaOrFail(tx, ideaId);
    await ideasRepository.review(tx, ideaId, { reviewerId: user.id, feedback });

    await recordActivity(tx, {
      projectId: idea.projectId,
      userId: user.id,
      actionType: 'IDEA_FEEDBACK',
      description: `Parecer técnico registrado em "${idea.title}"`,
      metadata: { ideaId, authorId: idea.authorId },
    });
  });

  return getIdeaOrFail(pool, ideaId);
}

/**
 * Fluxo de aprovação: a ideia/sugestão do gestor vira uma task real (source = IDEA),
 * já triada e vinculada à etapa escolhida pelo engenheiro, tudo numa única transação.
 */
export async function approveIdea(
  user: AuthUser,
  ideaId: string,
  input: ApproveIdeaInput,
): Promise<{ idea: Idea; task: Task }> {
  const taskId = await withTransaction(async (tx) => {
    const idea = await lockIdeaOrFail(tx, ideaId);
    if (idea.status !== 'UNDER_REVIEW') {
      throw conflict(`Só é possível aprovar itens em análise (status atual: ${IDEA_STATUS_LABEL[idea.status]}).`);
    }

    const projectId = input.projectId ?? idea.projectId;
    if (!projectId) throw unprocessable('Informe o projeto (projectId) em que a ideia será implementada.');
    const project = await projectsRepository.findById(tx, projectId);
    if (!project) throw notFound('Projeto não encontrado.');
    assertNotArchived(project);
    const stage = await requireStageInProject(tx, projectId, input.stageId);

    const title = input.taskTitle ?? idea.title;
    const newTaskId = await tasksRepository.insert(tx, {
      projectId,
      stageId: stage.id,
      ideaId: idea.id,
      title,
      description: idea.content,
      priority: input.priority,
      status: 'TODO',
      source: 'IDEA',
      // created_by aponta para o autor da ideia: a task continua identificada como pedido do gestor.
      createdBy: idea.authorId,
      assignedTo: input.assignedTo ?? user.id,
      triaged: true,
    });

    await ideasRepository.review(tx, ideaId, {
      reviewerId: user.id,
      feedback: input.feedback ?? null,
      status: 'APPROVED',
      projectId,
    });

    await recordActivity(tx, {
      projectId,
      userId: user.id,
      actionType: 'IDEA_APPROVED',
      description: `"${idea.title}" (${idea.authorName}) aprovada e planejada na etapa "${stage.title}"`,
      metadata: { ideaId, taskId: newTaskId, stageId: stage.id, authorId: idea.authorId, priority: input.priority },
    });
    return newTaskId;
  });

  const [idea, task] = await Promise.all([getIdeaOrFail(pool, ideaId), tasksRepository.findById(pool, taskId)]);
  return { idea, task: task! };
}

export async function changeIdeaStatus(user: AuthUser, ideaId: string, input: ChangeIdeaStatusInput) {
  await withTransaction(async (tx) => {
    const idea = await lockIdeaOrFail(tx, ideaId);
    if (idea.status === input.status && !input.feedback) return;

    await ideasRepository.review(tx, ideaId, {
      reviewerId: user.id,
      feedback: input.feedback ?? null,
      status: input.status,
    });

    await recordActivity(tx, {
      projectId: idea.projectId,
      userId: user.id,
      actionType: 'IDEA_STATUS_CHANGED',
      description: `"${idea.title}": ${IDEA_STATUS_LABEL[idea.status]} → ${IDEA_STATUS_LABEL[input.status]}`,
      metadata: { ideaId, from: idea.status, to: input.status },
    });
  });

  return getIdeaOrFail(pool, ideaId);
}
