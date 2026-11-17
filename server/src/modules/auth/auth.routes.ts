/* Arquivo de rotas de autenticação.
   authRoutes: Rotas de autenticação.
*/

import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { authenticate } from '../../middlewares/authenticate.js';
import * as authController from './auth.controller.js';

/* Limite de requisições de login. */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: { code: 'TOO_MANY_REQUESTS', message: 'Muitas tentativas de login. Tente novamente mais tarde.' } },
});

/* Rotas de autenticação. */
export const authRoutes = Router();

authRoutes.post('/auth/login', loginLimiter, authController.login);
authRoutes.get('/auth/me', authenticate, authController.me);
