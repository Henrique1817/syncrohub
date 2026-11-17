/* Arquivo de token de autenticação.
   signAccessToken: Função para assinar um token de acesso.
   verifyAccessToken: Função para verificar um token de acesso.
*/

import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { unauthorized } from '../../shared/errors/app-error.js';

const ISSUER = 'syncrohub-api';

// Função para assinar um token de acesso.
export function signAccessToken(userId: string): string {
  return jwt.sign({}, env.JWT_SECRET, {
    algorithm: 'HS256',
    issuer: ISSUER,
    subject: userId,
    expiresIn: env.JWT_TTL_SECONDS,
  });
}

/** Retorna o id do usuário (claim `sub`) ou lança 401. */
export function verifyAccessToken(token: string): string {
  try {
    const payload = jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'], issuer: ISSUER });
    if (typeof payload === 'string' || !payload.sub) throw new Error('Token sem subject');
    return payload.sub;
  } catch {
    throw unauthorized('Token inválido ou expirado.');
  }
}
