import type { Queryable } from '../../infra/db/pool.js';
import { buildSetClause, queryMany, queryOne } from '../../infra/db/sql.js';
import type { TaskPriority, TaskSource, TaskStatus } from '../../shared/domain/enums.js';
import type { Task } from './tasks.types.js';

const TASK_SELECT = `
  SELECT t.id,
         t.project_id   AS "projectId",
         t.stage_id     AS "stageId",
         s.title        AS "stageTitle",
         t.idea_id      AS "ideaId",
         t.title,
         t.description,
         t.priority,
         t.status,
         t.source,
         t.created_by   AS "createdBy",
         cu.name        AS "createdByName",
         cu.role        AS "createdByRole",
         t.assigned_to  AS "assignedTo",
         au.name        AS "assignedToName",
         t.start_date   AS "startDate",
         t.due_date     AS "dueDate",
         t.triaged_at   AS "triagedAt",
         t.completed_at AS "completedAt",
         t.created_at   AS "createdAt",
         t.updated_at   AS "updatedAt"
    FROM tasks t
    JOIN users cu               ON cu.id = t.created_by
    LEFT JOIN users au          ON au.id = t.assigned_to
    LEFT JOIN project_stages s  ON s.id = t.stage_id`;

export function findById(db: Queryable, id: string) {
  return queryOne<Task>(db, `${TASK_SELECT} WHERE t.id = $1`, [id]);
}

export function findByIdForUpdate(db: Queryable, id: string) {
  return queryOne<Task>(db, `${TASK_SELECT} WHERE t.id = $1 FOR UPDATE OF t`, [id]);
}

export interface ListTasksFilter {
  status?: TaskStatus;
  stageId?: string;
  source?: TaskSource;
  assignedTo?: string;
}

export function listByProject(db: Queryable, projectId: string, filter: ListTasksFilter) {
  return queryMany<Task>(
    db,
    `${TASK_SELECT}
      WHERE t.project_id = $1
        AND ($2::task_status IS NULL OR t.status = $2::task_status)
        AND ($3::uuid        IS NULL OR t.stage_id = $3::uuid)
        AND ($4::task_source IS NULL OR t.source = $4::task_source)
        AND ($5::uuid        IS NULL OR t.assigned_to = $5::uuid)
      ORDER BY s.order_index NULLS FIRST, t.priority DESC, t.created_at`,
    [projectId, filter.status ?? null, filter.stageId ?? null, filter.source ?? null, filter.assignedTo ?? null],
  );
}

/** Fila de triagem do engenheiro: demandas em BACKLOG, mais urgentes e mais antigas primeiro. */
export function listTriageQueue(db: Queryable, filter: { projectId?: string }) {
  return queryMany<Task>(
    db,
    `${TASK_SELECT}
      WHERE t.status = 'BACKLOG'
        AND ($1::uuid IS NULL OR t.project_id = $1::uuid)
        AND EXISTS (SELECT 1 FROM projects p WHERE p.id = t.project_id AND p.archived_at IS NULL)
      ORDER BY t.priority DESC, t.created_at`,
    [filter.projectId ?? null],
  );
}

export interface InsertTaskRow {
  projectId: string;
  stageId: string | null;
  ideaId: string | null;
  title: string;
  description: string | null;
  priority: TaskPriority;
  status: Exclude<TaskStatus, 'DONE'>;
  source: TaskSource;
  createdBy: string;
  assignedTo: string | null;
  triaged: boolean;
  startDate?: string | null;
  dueDate?: string | null;
}

export async function insert(db: Queryable, row: InsertTaskRow): Promise<string> {
  const inserted = await queryOne<{ id: string }>(
    db,
    `INSERT INTO tasks (project_id, stage_id, idea_id, title, description, priority, status, source,
                        created_by, assigned_to, triaged_at, start_date, due_date)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CASE WHEN $11::boolean THEN now() END, $12, $13)
     RETURNING id`,
    [
      row.projectId,
      row.stageId,
      row.ideaId,
      row.title,
      row.description,
      row.priority,
      row.status,
      row.source,
      row.createdBy,
      row.assignedTo,
      row.triaged,
      row.startDate ?? null,
      row.dueDate ?? null,
    ],
  );
  return inserted!.id;
}

export interface TaskPatch {
  title?: string;
  description?: string | null;
  priority?: TaskPriority;
  stageId?: string | null;
  assignedTo?: string | null;
  startDate?: string | null;
  dueDate?: string | null;
}

export async function update(db: Queryable, id: string, patch: TaskPatch): Promise<void> {
  const { assignments, values } = buildSetClause(
    { ...patch },
    {
      title: 'title',
      description: 'description',
      priority: 'priority',
      stageId: 'stage_id',
      assignedTo: 'assigned_to',
      startDate: 'start_date',
      dueDate: 'due_date',
    },
    2,
  );
  if (!assignments.length) return;
  await db.query(`UPDATE tasks SET ${assignments.join(', ')} WHERE id = $1`, [id, ...values]);
}

export async function triage(
  db: Queryable,
  id: string,
  data: { stageId: string; priority?: TaskPriority | undefined; assignedTo: string | null; status: TaskStatus },
): Promise<void> {
  await db.query(
    `UPDATE tasks
        SET stage_id    = $2,
            priority    = COALESCE($3::task_priority, priority),
            assigned_to = $4,
            status      = $5::task_status,
            triaged_at  = now()
      WHERE id = $1`,
    [id, data.stageId, data.priority ?? null, data.assignedTo, data.status],
  );
}

export async function updateStatus(db: Queryable, id: string, status: TaskStatus): Promise<void> {
  await db.query(
    `UPDATE tasks
        SET status       = $2::task_status,
            completed_at = CASE WHEN $2::task_status = 'DONE' THEN now() END
      WHERE id = $1`,
    [id, status],
  );
}

export async function remove(db: Queryable, id: string): Promise<void> {
  await db.query('DELETE FROM tasks WHERE id = $1', [id]);
}
