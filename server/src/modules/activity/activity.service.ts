/* Arquivo de serviço de atividades.
   recordActivity: Função para registrar uma nova atividade.
   listActivity: Função para listar todas as atividades.
   postEngineerUpdate: Função para criar uma nova atividade de atualização de engenheiro.
*/

import { pool } from '../../infra/db/pool.js';
import type { Queryable } from '../../infra/db/pool.js';
import type { AuthUser } from '../../shared/domain/auth.js';
import { notFound } from '../../shared/errors/app-error.js';
import * as projectsRepository from '../projects/projects.repository.js';
import * as activityRepository from './activity.repository.js';
import type { EngineerUpdateInput, ListActivityQuery } from './activity.schemas.js';
import type { NewActivity } from './activity.types.js';

/** Deve ser chamado dentro da mesma transação da mudança que está sendo registrada. */
export function recordActivity(db: Queryable, entry: NewActivity) {
  return activityRepository.insert(db, entry);
}

/* Função para listar todas as atividades. */
export async function listActivity(query: ListActivityQuery) {
  const rows = await activityRepository.list(pool, { ...query, limit: query.limit + 1 });
  const hasMore = rows.length > query.limit;
  const data = hasMore ? rows.slice(0, query.limit) : rows;
  return { data, nextCursor: hasMore ? (data[data.length - 1]?.id ?? null) : null };
}

/* Função para criar uma nova atividade de atualização de engenheiro. */
export async function postEngineerUpdate(user: AuthUser, projectId: string, input: EngineerUpdateInput) {
  const project = await projectsRepository.findById(pool, projectId);
  if (!project) throw notFound('Projeto não encontrado.');

  const id = await recordActivity(pool, {
    projectId,
    userId: user.id,
    actionType: 'ENGINEER_UPDATE',
    description: input.title,
    metadata: { content: input.content ?? null, metrics: input.metrics ?? {} },
  });

  return (await activityRepository.findById(pool, id))!;
}
