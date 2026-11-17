import type { Queryable } from '../../infra/db/pool.js';
import { queryMany, queryOne } from '../../infra/db/sql.js';
import type { UserRole } from '../../shared/domain/enums.js';
import type { User, UserWithPassword } from './users.types.js';

const USER_COLUMNS = `
  id, name, email, role,
  position_title AS "positionTitle",
  department,
  is_active      AS "isActive",
  created_at     AS "createdAt"`;

export function findActiveById(db: Queryable, id: string) {
  return queryOne<User>(db, `SELECT ${USER_COLUMNS} FROM users WHERE id = $1 AND is_active`, [id]);
}

export function findByEmailWithPassword(db: Queryable, email: string) {
  return queryOne<UserWithPassword>(
    db,
    `SELECT ${USER_COLUMNS}, password_hash AS "passwordHash" FROM users WHERE lower(email) = lower($1)`,
    [email],
  );
}

export function listActive(db: Queryable, filter: { role?: UserRole }) {
  return queryMany<User>(
    db,
    `SELECT ${USER_COLUMNS} FROM users
      WHERE is_active AND ($1::user_role IS NULL OR role = $1::user_role)
      ORDER BY role, name`,
    [filter.role ?? null],
  );
}

export interface InsertUserRow {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  positionTitle: string | null;
}

export async function insert(db: Queryable, row: InsertUserRow): Promise<User> {
  const user = await queryOne<User>(
    db,
    `INSERT INTO users (name, email, password_hash, role, position_title, activated_at)
     VALUES ($1, $2, $3, $4, $5, now())
     RETURNING ${USER_COLUMNS}`,
    [row.name, row.email, row.passwordHash, row.role, row.positionTitle],
  );
  return user!;
}
