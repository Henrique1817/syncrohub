import type { Queryable } from '../../infra/db/pool.js';
import { queryMany, queryOne } from '../../infra/db/sql.js';
import type { Comment } from './comments.types.js';

const COMMENT_SELECT = `
  SELECT c.id,
         c.project_id      AS "projectId",
         c.stage_id        AS "stageId",
         s.title           AS "stageTitle",
         c.author_id       AS "authorId",
         u.name            AS "authorName",
         u.role            AS "authorRole",
         u.position_title  AS "authorPositionTitle",
         c.content,
         c.created_at      AS "createdAt",
         c.updated_at      AS "updatedAt"
    FROM comments c
    JOIN users u               ON u.id = c.author_id
    LEFT JOIN project_stages s ON s.id = c.stage_id`;

export function findById(db: Queryable, id: string) {
  return queryOne<Comment>(db, `${COMMENT_SELECT} WHERE c.id = $1`, [id]);
}

export function listByProject(db: Queryable, projectId: string, filter: { stageId?: string }) {
  return queryMany<Comment>(
    db,
    `${COMMENT_SELECT}
      WHERE c.project_id = $1
        AND ($2::uuid IS NULL OR c.stage_id = $2::uuid)
      ORDER BY c.created_at DESC`,
    [projectId, filter.stageId ?? null],
  );
}

export async function insert(
  db: Queryable,
  row: { projectId: string; stageId: string | null; authorId: string; content: string },
): Promise<string> {
  const inserted = await queryOne<{ id: string }>(
    db,
    `INSERT INTO comments (project_id, stage_id, author_id, content)
     VALUES ($1, $2, $3, $4)
     RETURNING id`,
    [row.projectId, row.stageId, row.authorId, row.content],
  );
  return inserted!.id;
}
