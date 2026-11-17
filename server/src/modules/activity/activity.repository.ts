/* Arquivo de repositório de atividades.
   insert: Função para inserir uma nova atividade.
   findById: Função para buscar uma atividade por ID.
   list: Função para listar todas as atividades.
*/

import type { Queryable } from '../../infra/db/pool.js';
import { queryMany, queryOne } from '../../infra/db/sql.js';
import type { ActivityLog, NewActivity } from './activity.types.js';

/* Query para selecionar todas as atividades. */
const ACTIVITY_SELECT = `
  SELECT a.id::text            AS id,
         a.project_id          AS "projectId",
         p.name                AS "projectName",
         a.user_id             AS "userId",
         u.name                AS "userName",
         u.role                AS "userRole",
         u.position_title      AS "userPositionTitle",
         a.action_type         AS "actionType",
         a.description,
         a.metadata,
         a.created_at          AS "createdAt"
    FROM activity_logs a
    LEFT JOIN users u    ON u.id = a.user_id
    LEFT JOIN projects p ON p.id = a.project_id`;

/* Função para inserir uma nova atividade. */
export async function insert(db: Queryable, entry: NewActivity): Promise<string> {
  const row = await queryOne<{ id: string }>(
    db,
    `INSERT INTO activity_logs (project_id, user_id, action_type, description, metadata)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id::text AS id`,
    [entry.projectId, entry.userId, entry.actionType, entry.description, JSON.stringify(entry.metadata ?? {})],
  );
  return row!.id;
}

/* Função para buscar uma atividade por ID. */
export function findById(db: Queryable, id: string) {
  return queryOne<ActivityLog>(db, `${ACTIVITY_SELECT} WHERE a.id = $1::bigint`, [id]);
}

/* Interface para filtro de listagem de atividades. */
export interface ListActivityFilter {
  projectId?: string;
  /** Retorna registros com id menor que o cursor (paginação keyset, mais recentes primeiro). */
  cursor?: string;
  limit: number;
}

/* Função para listar todas as atividades. */
export function list(db: Queryable, filter: ListActivityFilter) {
  return queryMany<ActivityLog>(
    db,
    `${ACTIVITY_SELECT}
      WHERE ($1::uuid IS NULL OR a.project_id = $1::uuid)
        AND ($2::bigint IS NULL OR a.id < $2::bigint)
      ORDER BY a.id DESC
      LIMIT $3`,
    [filter.projectId ?? null, filter.cursor ?? null, filter.limit],
  );
}
