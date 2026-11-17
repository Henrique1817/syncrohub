import { pool } from '../../infra/db/pool.js';
import { withTransaction } from '../../infra/db/transaction.js';
import type { AuthUser } from '../../shared/domain/auth.js';
import { notFound } from '../../shared/errors/app-error.js';
import { recordActivity } from '../activity/activity.service.js';
import * as projectsRepository from '../projects/projects.repository.js';
import { requireStageInProject } from '../stages/stages.service.js';
import * as commentsRepository from './comments.repository.js';
import type { CreateCommentInput, ListCommentsQuery } from './comments.schemas.js';

export async function listComments(projectId: string, query: ListCommentsQuery) {
  if (!(await projectsRepository.findById(pool, projectId))) throw notFound('Projeto não encontrado.');
  return commentsRepository.listByProject(pool, projectId, query);
}

export async function addComment(user: AuthUser, projectId: string, input: CreateCommentInput) {
  const commentId = await withTransaction(async (tx) => {
    if (!(await projectsRepository.findById(tx, projectId))) throw notFound('Projeto não encontrado.');
    const stage = input.stageId ? await requireStageInProject(tx, projectId, input.stageId) : null;

    const id = await commentsRepository.insert(tx, {
      projectId,
      stageId: stage?.id ?? null,
      authorId: user.id,
      content: input.content,
    });

    await recordActivity(tx, {
      projectId,
      userId: user.id,
      actionType: 'COMMENT_ADDED',
      description: stage ? `${user.name} comentou na etapa "${stage.title}"` : `${user.name} comentou no projeto`,
      metadata: { commentId: id, stageId: stage?.id ?? null, preview: input.content.slice(0, 140) },
    });
    return id;
  });

  return (await commentsRepository.findById(pool, commentId))!;
}
