import type { Queryable } from '../../infra/db/pool.js';
import { buildSetClause, queryMany, queryOne } from '../../infra/db/sql.js';
import type { Department, InviteDeliveryStatus } from '../../shared/domain/enums.js';
import type { InvitationPreview, TeamMember } from './team.types.js';

const MEMBER_SELECT = `
  SELECT u.id, u.name, u.email, u.role, u.department,
         u.position_title AS "positionTitle",
         u.is_active      AS "isActive",
         CASE WHEN NOT u.is_active THEN 'DISABLED'
              WHEN u.password_hash IS NULL THEN 'PENDING'
              ELSE 'ACTIVE' END AS status,
         u.activated_at   AS "activatedAt",
         u.created_at     AS "createdAt",
         inv.latest       AS "latestInvitation"
    FROM users u
    LEFT JOIN LATERAL (
      SELECT json_build_object(
               'id', i.id,
               'createdAt', i.created_at,
               'expiresAt', i.expires_at,
               'deliveryStatus', i.delivery_status,
               'deliveryError', i.delivery_error
             ) AS latest
        FROM user_invitations i
       WHERE i.user_id = u.id
       ORDER BY i.created_at DESC
       LIMIT 1
    ) inv ON true`;

/** O engenheiro aparece primeiro; as regras de quem altera quem ficam no service. */
export function listMembers(db: Queryable) {
  return queryMany<TeamMember>(
    db,
    `${MEMBER_SELECT} ORDER BY (u.role = 'ENGINEER') DESC, u.department NULLS LAST, u.name`,
  );
}

export function findMemberById(db: Queryable, id: string) {
  return queryOne<TeamMember>(db, `${MEMBER_SELECT} WHERE u.id = $1`, [id]);
}

export async function emailExists(db: Queryable, email: string): Promise<boolean> {
  const row = await queryOne<{ exists: boolean }>(
    db,
    'SELECT EXISTS (SELECT 1 FROM users WHERE lower(email) = lower($1)) AS "exists"',
    [email],
  );
  return row?.exists ?? false;
}

export async function insertCollaborator(
  db: Queryable,
  row: { name: string; email: string; department: Department; positionTitle: string | null },
): Promise<string> {
  const inserted = await queryOne<{ id: string }>(
    db,
    `INSERT INTO users (name, email, password_hash, role, department, position_title)
     VALUES ($1, $2, NULL, 'COLLABORATOR', $3, $4)
     RETURNING id`,
    [row.name, row.email, row.department, row.positionTitle],
  );
  return inserted!.id;
}

export interface MemberPatch {
  name?: string;
  department?: Department;
  positionTitle?: string | null;
  isActive?: boolean;
}

export async function updateMember(db: Queryable, id: string, patch: MemberPatch): Promise<void> {
  const { assignments, values } = buildSetClause(
    { ...patch },
    { name: 'name', department: 'department', positionTitle: 'position_title', isActive: 'is_active' },
    2,
  );
  if (!assignments.length) return;
  await db.query(`UPDATE users SET ${assignments.join(', ')} WHERE id = $1`, [id, ...values]);
}

/** Um convite novo invalida os anteriores ainda abertos do mesmo usuário. */
export async function revokeOpenInvitations(db: Queryable, userId: string): Promise<void> {
  await db.query(
    `UPDATE user_invitations SET revoked_at = now()
      WHERE user_id = $1 AND accepted_at IS NULL AND revoked_at IS NULL`,
    [userId],
  );
}

export async function insertInvitation(
  db: Queryable,
  row: { userId: string; tokenHash: string; expiresAt: Date; createdBy: string },
): Promise<string> {
  const inserted = await queryOne<{ id: string }>(
    db,
    `INSERT INTO user_invitations (user_id, token_hash, expires_at, created_by)
     VALUES ($1, $2, $3, $4)
     RETURNING id`,
    [row.userId, row.tokenHash, row.expiresAt, row.createdBy],
  );
  return inserted!.id;
}

export async function setDelivery(
  db: Queryable,
  invitationId: string,
  status: InviteDeliveryStatus,
  error: string | null,
): Promise<void> {
  await db.query('UPDATE user_invitations SET delivery_status = $2, delivery_error = $3 WHERE id = $1', [
    invitationId,
    status,
    error,
  ]);
}

interface OpenInvitation extends InvitationPreview {
  invitationId: string;
  userId: string;
}

/** Só convites utilizáveis: não aceitos, não revogados, dentro do prazo e de um usuário ativo. */
export function findOpenInvitation(db: Queryable, tokenHash: string, { forUpdate = false } = {}) {
  return queryOne<OpenInvitation>(
    db,
    `SELECT i.id AS "invitationId", u.id AS "userId", u.name, u.email, u.department, i.expires_at AS "expiresAt"
       FROM user_invitations i
       JOIN users u ON u.id = i.user_id
      WHERE i.token_hash = $1
        AND i.accepted_at IS NULL
        AND i.revoked_at IS NULL
        AND i.expires_at > now()
        AND u.is_active
      ${forUpdate ? 'FOR UPDATE OF i' : ''}`,
    [tokenHash],
  );
}

export async function acceptInvitation(
  db: Queryable,
  { invitationId, userId, passwordHash }: { invitationId: string; userId: string; passwordHash: string },
): Promise<void> {
  await db.query('UPDATE user_invitations SET accepted_at = now() WHERE id = $1', [invitationId]);
  await db.query(
    'UPDATE users SET password_hash = $2, activated_at = COALESCE(activated_at, now()) WHERE id = $1',
    [userId, passwordHash],
  );
}
