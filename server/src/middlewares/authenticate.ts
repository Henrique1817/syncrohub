/* Arquivo de middleware de autenticação.
   authenticate: Middleware de autenticação.
*/

import type { RequestHandler } from 'express';
import { pool } from '../infra/db/pool.js';
import { verifyAccessToken } from '../modules/auth/token.js';
import * as usersRepository from '../modules/users/users.repository.js';
import { unauthorized } from '../shared/errors/app-error.js';

/** Valida o JWT e recarrega o usuário: desativações e trocas de perfil valem na hora. */
export const authenticate: RequestHandler = async (req, _res, next) => {
  const [scheme, token] = req.get('authorization')?.split(' ') ?? [];
  if (scheme !== 'Bearer' || !token) throw unauthorized();

  const userId = verifyAccessToken(token);
  const user = await usersRepository.findActiveById(pool, userId);
  if (!user) throw unauthorized('Sessão inválida. Faça login novamente.');

  req.user = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    positionTitle: user.positionTitle,
    department: user.department,
  };
  next();
};
