/* Arquivo de controller de autenticação.
   login: Controller de login.
   me: Controller de consulta de usuário autenticado.
*/

import type { RequestHandler } from 'express';
import { requireUser } from '../../shared/http/request.js';
import { loginSchema } from './auth.schemas.js';
import * as authService from './auth.service.js';

/* Controller de login. */
export const login: RequestHandler = async (req, res) => {
  const input = loginSchema.parse(req.body);
  res.json({ data: await authService.login(input) });
};

/* Controller de consulta de usuário autenticado. */
export const me: RequestHandler = (req, res) => {
  res.json({ data: requireUser(req) });
};
