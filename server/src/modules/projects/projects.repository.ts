import type { Queryable } from '../../infra/db/pool.js';
import { buildSetClause, queryMany, queryOne } from '../../infra/db/sql.js';
import type { ProjectStatus } from '../../shared/domain/enums.js';
import type { Project, ProjectOverview } from './projects.types.js';

const PROJECT_COLUMNS = `
  id, name, description, status,
  progress_percentage   AS "progressPercentage",
  due_date              AS "dueDate",
  archived_at           AS "archivedAt",
  github_repo           AS "githubRepo",
  github_url            AS "githubUrl",
  github_default_branch AS "githubDefaultBranch",
  github_last_synced_at AS "githubLastSyncedAt",
  created_by            AS "createdBy",
  created_at            AS "createdAt",
  updated_at            AS "updatedAt"`;

const OVERVIEW_SELECT = `
  SELECT ${PROJECT_COLUMNS},
         created_by_name          AS "createdByName",
         total_stages             AS "totalStages",
         done_stages              AS "doneStages",
         overdue_stages           AS "overdueStages",
         current_stage            AS "currentStage",
         open_tasks               AS "openTasks",
         triage_tasks             AS "triageTasks",
         pending_manager_requests AS "pendingManagerRequests"
    FROM project_overview`;

export function listOverview(db: Queryable, filter: { status?: ProjectStatus; archived: boolean }) {
  return queryMany<ProjectOverview>(
    db,
    `${OVERVIEW_SELECT}
      WHERE ($1::project_status IS NULL OR status = $1::project_status)
        AND (archived_at IS NOT NULL) = $2
      ORDER BY ${filter.archived ? 'archived_at' : 'updated_at'} DESC`,
    [filter.status ?? null, filter.archived],
  );
}

export function findOverviewById(db: Queryable, id: string) {
  return queryOne<ProjectOverview>(db, `${OVERVIEW_SELECT} WHERE id = $1`, [id]);
}

export function findById(db: Queryable, id: string) {
  return queryOne<Project>(db, `SELECT ${PROJECT_COLUMNS} FROM projects WHERE id = $1`, [id]);
}

/**
 * Serializa operações estruturais por projeto (ordem das etapas, avanço de status).
 * Sempre travar o projeto antes das etapas para manter uma ordem de lock única e evitar deadlocks.
 */
export function lockById(db: Queryable, id: string) {
  return queryOne<Project>(db, `SELECT ${PROJECT_COLUMNS} FROM projects WHERE id = $1 FOR UPDATE`, [id]);
}

export async function insert(
  db: Queryable,
  row: {
    name: string;
    description: string | null;
    status: ProjectStatus;
    dueDate: string | null;
    githubRepo: string | null;
    githubUrl: string | null;
    githubDefaultBranch: string | null;
    createdBy: string;
  },
): Promise<Project> {
  const project = await queryOne<Project>(
    db,
    `INSERT INTO projects (name, description, status, due_date, github_repo, github_url, github_default_branch, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING ${PROJECT_COLUMNS}`,
    [
      row.name,
      row.description,
      row.status,
      row.dueDate,
      row.githubRepo,
      row.githubUrl,
      row.githubDefaultBranch,
      row.createdBy,
    ],
  );
  return project!;
}

export interface ProjectPatch {
  name?: string;
  description?: string | null;
  status?: ProjectStatus;
  dueDate?: string | null;
  githubRepo?: string | null;
  githubUrl?: string | null;
  githubDefaultBranch?: string | null;
}

export async function update(db: Queryable, id: string, patch: ProjectPatch): Promise<Project | null> {
  const { assignments, values } = buildSetClause(
    { ...patch },
    {
      name: 'name',
      description: 'description',
      status: 'status',
      dueDate: 'due_date',
      githubRepo: 'github_repo',
      githubUrl: 'github_url',
      githubDefaultBranch: 'github_default_branch',
    },
    2,
  );
  if (!assignments.length) return findById(db, id);

  return queryOne<Project>(
    db,
    `UPDATE projects SET ${assignments.join(', ')} WHERE id = $1 RETURNING ${PROJECT_COLUMNS}`,
    [id, ...values],
  );
}

export function findActiveByGitHubRepo(db: Queryable, fullName: string) {
  return queryMany<Project>(
    db,
    `SELECT ${PROJECT_COLUMNS}
       FROM projects
      WHERE lower(github_repo) = lower($1)
        AND archived_at IS NULL`,
    [fullName],
  );
}

export async function touchGitHubSyncedAt(db: Queryable, id: string): Promise<void> {
  await db.query('UPDATE projects SET github_last_synced_at = now() WHERE id = $1', [id]);
}

export async function setArchived(db: Queryable, id: string, archived: boolean): Promise<Project> {
  const project = await queryOne<Project>(
    db,
    `UPDATE projects SET archived_at = CASE WHEN $2::boolean THEN now() END WHERE id = $1 RETURNING ${PROJECT_COLUMNS}`,
    [id, archived],
  );
  return project!;
}

export async function remove(db: Queryable, id: string): Promise<boolean> {
  const { rowCount } = await db.query('DELETE FROM projects WHERE id = $1', [id]);
  return (rowCount ?? 0) > 0;
}

export async function getProgress(db: Queryable, id: string): Promise<number> {
  const row = await queryOne<{ progress: number }>(
    db,
    'SELECT progress_percentage AS progress FROM projects WHERE id = $1',
    [id],
  );
  return row?.progress ?? 0;
}
