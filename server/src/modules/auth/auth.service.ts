/* Arquivo de serviço de autenticação.
   login: Função para fazer login.
*/

import bcrypt from 'bcryptjs';
import { env } from '../../config/env.js';
import { pool } from '../../infra/db/pool.js';
import { unauthorized } from '../../shared/errors/app-error.js';
import * as usersRepository from '../users/users.repository.js';
import { toPublicUser } from '../users/users.types.js';
import type { LoginInput } from './auth.schemas.js';
import { signAccessToken } from './token.js';

// Comparar contra um hash fictício quando o e-mail não existe evita enumeração de usuários por tempo de resposta.
const DUMMY_HASH = await bcrypt.hash('syncrohub-timing-guard', 12);

/* Função para fazer login. */
export async function login({ email, password }: LoginInput) {
  const user = await usersRepository.findByEmailWithPassword(pool, email);
  const passwordMatches = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);

  if (!user || !user.isActive || !passwordMatches) throw unauthorized('E-mail ou senha inválidos.');

  return {
    accessToken: signAccessToken(user.id),
    tokenType: 'Bearer' as const,
    expiresIn: env.JWT_TTL_SECONDS,
    user: toPublicUser(user),
  };
}
