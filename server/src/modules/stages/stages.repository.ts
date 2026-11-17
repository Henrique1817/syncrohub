import type { Queryable } from '../../infra/db/pool.js';
import { buildSetClause, queryMany, queryOne } from '../../infra/db/sql.js';
import type { StageStatus } from '../../shared/domain/enums.js';
import type { Stage, StageWithStats } from './stages.types.js';

const STAGE_COLUMNS = `
  s.id,
  s.project_id   AS "projectId",
  s.title,
  s.description,
  s.order_index  AS "orderIndex",
  s.status,
  s.due_date     AS "dueDate",
  s.started_at   AS "startedAt",
  s.completed_at AS "completedAt",
  s.created_at   AS "createdAt",
  s.updated_at   AS "updatedAt"`;

export interface StageDraft {
  title: string;
  description?: string | undefined;
  dueDate?: string | undefined;
}

export function listByProject(db: Queryable, projectId: string) {
  return queryMany<StageWithStats>(
    db,
    `SELECT ${STAGE_COLUMNS},
            count(t.id)::int                                   AS "totalTasks",
            count(t.id) FILTER (WHERE t.status = 'DONE')::int  AS "doneTasks"
       FROM project_stages s
       LEFT JOIN tasks t ON t.stage_id = s.id
      WHERE s.project_id = $1
      GROUP BY s.id
      ORDER BY s.order_index`,
    [projectId],
  );
}

export function findById(db: Queryable, id: string) {
  return queryOne<Stage>(db, `SELECT ${STAGE_COLUMNS} FROM project_stages s WHERE s.id = $1`, [id]);
}

export function findByIdForUpdate(db: Queryable, id: string) {
  return queryOne<Stage>(db, `SELECT ${STAGE_COLUMNS} FROM project_stages s WHERE s.id = $1 FOR UPDATE`, [id]);
}

export function findInProject(db: Queryable, projectId: string, stageId: string) {
  return queryOne<Stage>(
    db,
    `SELECT ${STAGE_COLUMNS} FROM project_stages s WHERE s.id = $1 AND s.project_id = $2`,
    [stageId, projectId],
  );
}

export async function listIds(db: Queryable, projectId: string): Promise<string[]> {
  const rows = await queryMany<{ id: string }>(db, 'SELECT id FROM project_stages WHERE project_id = $1', [projectId]);
  return rows.map((row) => row.id);
}

export async function insert(db: Queryable, projectId: string, draft: StageDraft): Promise<Stage> {
  const stage = await queryOne<Stage>(
    db,
    `INSERT INTO project_stages AS s (project_id, title, description, due_date, order_index)
     VALUES ($1, $2, $3, $4,
             (SELECT COALESCE(max(order_index) + 1, 0) FROM project_stages WHERE project_id = $1))
     RETURNING ${STAGE_COLUMNS}`,
    [projectId, draft.title, draft.description ?? null, draft.dueDate ?? null],
  );
  return stage!;
}

/** Devolve as etapas criadas em ordem de execução. */
export async function insertMany(db: Queryable, projectId: string, drafts: StageDraft[]): Promise<Stage[]> {
  if (!drafts.length) return [];
  const stages = await queryMany<Stage>(
    db,
    `INSERT INTO project_stages AS s (project_id, title, description, due_date, order_index)
     SELECT $1, d.title, d.description, d.due_date, d.ord - 1
       FROM unnest($2::text[], $3::text[], $4::date[]) WITH ORDINALITY AS d(title, description, due_date, ord)
     RETURNING ${STAGE_COLUMNS}`,
    [
      projectId,
      drafts.map((d) => d.title),
      drafts.map((d) => d.description ?? null),
      drafts.map((d) => d.dueDate ?? null),
    ],
  );
  return stages.sort((a, b) => a.orderIndex - b.orderIndex);
}

export interface StagePatch {
  title?: string;
  description?: string | null;
  dueDate?: string | null;
}

export async function update(db: Queryable, id: string, patch: StagePatch): Promise<Stage | null> {
  const { assignments, values } = buildSetClause(
    { ...patch },
    { title: 'title', description: 'description', dueDate: 'due_date' },
    2,
  );
  if (!assignments.length) return findById(db, id);

  return queryOne<Stage>(
    db,
    `UPDATE project_stages AS s SET ${assignments.join(', ')} WHERE s.id = $1 RETURNING ${STAGE_COLUMNS}`,
    [id, ...values],
  );
}

export async function updateStatus(db: Queryable, id: string, status: StageStatus): Promise<Stage> {
  const stage = await queryOne<Stage>(
    db,
    `UPDATE project_stages AS s
        SET status       = $2::stage_status,
            started_at   = CASE WHEN $2::stage_status = 'PENDING' THEN NULL ELSE COALESCE(s.started_at, now()) END,
            completed_at = CASE WHEN $2::stage_status = 'DONE' THEN now() END
      WHERE s.id = $1
      RETURNING ${STAGE_COLUMNS}`,
    [id, status],
  );
  return stage!;
}

export async function hasActiveStage(db: Queryable, projectId: string): Promise<boolean> {
  const row = await queryOne<{ exists: boolean }>(
    db,
    `SELECT EXISTS (SELECT 1 FROM project_stages WHERE project_id = $1 AND status = 'ACTIVE') AS "exists"`,
    [projectId],
  );
  return row?.exists ?? false;
}

export function findNextPendingForUpdate(db: Queryable, projectId: string, afterOrderIndex: number) {
  return queryOne<Stage>(
    db,
    `SELECT ${STAGE_COLUMNS}
       FROM project_stages s
      WHERE s.project_id = $1 AND s.status = 'PENDING' AND s.order_index > $2
      ORDER BY s.order_index
      LIMIT 1
      FOR UPDATE`,
    [projectId, afterOrderIndex],
  );
}

/** `orderedIds` deve conter exatamente as etapas do projeto; a constraint deferrable permite trocas no mesmo UPDATE. */
export async function reorder(db: Queryable, projectId: string, orderedIds: string[]): Promise<void> {
  await db.query(
    `UPDATE project_stages AS s
        SET order_index = o.ord - 1
       FROM unnest($2::uuid[]) WITH ORDINALITY AS o(id, ord)
      WHERE s.id = o.id AND s.project_id = $1`,
    [projectId, orderedIds],
  );
}

export async function countTasks(db: Queryable, stageId: string): Promise<number> {
  const row = await queryOne<{ total: number }>(db, 'SELECT count(*)::int AS total FROM tasks WHERE stage_id = $1', [
    stageId,
  ]);
  return row?.total ?? 0;
}

export async function remove(db: Queryable, id: string): Promise<void> {
  await db.query('DELETE FROM project_stages WHERE id = $1', [id]);
}
