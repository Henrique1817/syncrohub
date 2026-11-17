import bcrypt from 'bcryptjs';
import { pool } from '../../infra/db/pool.js';
import type { UserRole } from '../../shared/domain/enums.js';
import * as usersRepository from './users.repository.js';
import type { CreateUserInput } from './users.schemas.js';

const BCRYPT_COST = 12;

export function listUsers(filter: { role?: UserRole }) {
  return usersRepository.listActive(pool, filter);
}

export async function createUser(input: CreateUserInput) {
  return usersRepository.insert(pool, {
    name: input.name,
    email: input.email,
    passwordHash: await bcrypt.hash(input.password, BCRYPT_COST),
    role: input.role,
    positionTitle: input.positionTitle ?? null,
  });
}
