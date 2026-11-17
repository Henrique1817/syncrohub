import type { Queryable } from '../../infra/db/pool.js';
import { queryMany, queryOne } from '../../infra/db/sql.js';
import type { IdeaCategory, IdeaStatus } from '../../shared/domain/enums.js';
import type { Idea } from './ideas.types.js';

const IDEA_SELECT = `
  SELECT i.id,
         i.project_id        AS "projectId",
         p.name              AS "projectName",
         i.author_id         AS "authorId",
         au.name             AS "authorName",
         au.position_title   AS "authorPositionTitle",
         au.department       AS "authorDepartment",
         i.category,
         i.title,
         i.content,
         i.status,
         i.engineer_feedback AS "engineerFeedback",
         i.reviewed_by       AS "reviewedBy",
         i.reviewed_at       AS "reviewedAt",
         t.id                AS "convertedTaskId",
         i.created_at        AS "createdAt",
         i.updated_at        AS "updatedAt"
    FROM ideas_suggestions i
    JOIN users au         ON au.id = i.author_id
    LEFT JOIN projects p  ON p.id = i.project_id
    LEFT JOIN tasks t     ON t.idea_id = i.id`;

export function findById(db: Queryable, id: string) {
  return queryOne<Idea>(db, `${IDEA_SELECT} WHERE i.id = $1`, [id]);
}

export function findByIdForUpdate(db: Queryable, id: string) {
  return queryOne<Idea>(db, `${IDEA_SELECT} WHERE i.id = $1 FOR UPDATE OF i`, [id]);
}

export interface ListIdeasFilter {
  status?: IdeaStatus;
  category?: IdeaCategory;
  projectId?: string;
  authorId?: string;
}

export function list(db: Queryable, filter: ListIdeasFilter) {
  return queryMany<Idea>(
    db,
    `${IDEA_SELECT}
      WHERE ($1::idea_status   IS NULL OR i.status = $1::idea_status)
        AND ($2::idea_category IS NULL OR i.category = $2::idea_category)
        AND ($3::uuid          IS NULL OR i.project_id = $3::uuid)
        AND ($4::uuid          IS NULL OR i.author_id = $4::uuid)
      ORDER BY (i.status = 'UNDER_REVIEW') DESC, i.created_at DESC`,
    [filter.status ?? null, filter.category ?? null, filter.projectId ?? null, filter.authorId ?? null],
  );
}

export async function insert(
  db: Queryable,
  row: { projectId: string | null; authorId: string; category: IdeaCategory; title: string; content: string },
): Promise<string> {
  const inserted = await queryOne<{ id: string }>(
    db,
    `INSERT INTO ideas_suggestions (project_id, author_id, category, title, content)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id`,
    [row.projectId, row.authorId, row.category, row.title, row.content],
  );
  return inserted!.id;
}

/** Registra o parecer técnico; `feedback` nulo preserva o parecer anterior. */
export async function review(
  db: Queryable,
  id: string,
  data: { reviewerId: string; feedback: string | null; status?: IdeaStatus; projectId?: string },
): Promise<void> {
  await db.query(
    `UPDATE ideas_suggestions
        SET engineer_feedback = COALESCE($3, engineer_feedback),
            status            = COALESCE($4::idea_status, status),
            project_id        = COALESCE($5::uuid, project_id),
            reviewed_by       = $2,
            reviewed_at       = now()
      WHERE id = $1`,
    [id, data.reviewerId, data.feedback, data.status ?? null, data.projectId ?? null],
  );
}

/** Chamado quando a task derivada é concluída. Retorna `true` se a ideia mudou de status. */
export async function markImplemented(db: Queryable, id: string): Promise<boolean> {
  const { rowCount } = await db.query(
    `UPDATE ideas_suggestions SET status = 'IMPLEMENTED' WHERE id = $1 AND status = 'APPROVED'`,
    [id],
  );
  return (rowCount ?? 0) > 0;
}
