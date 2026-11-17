import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { teamManagers } from '../../middlewares/authorize.js';
import * as teamController from './team.controller.js';

const invitationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: { code: 'TOO_MANY_REQUESTS', message: 'Muitas tentativas. Tente novamente mais tarde.' } },
});

/** Públicas: quem abre o link do e-mail ainda não tem sessão. */
export const invitationRoutes = Router();

invitationRoutes.get('/auth/invitations/:token', invitationLimiter, teamController.getInvitation);
invitationRoutes.post('/auth/invitations/:token/accept', invitationLimiter, teamController.acceptInvitation);

export const teamRoutes = Router();

teamRoutes.get('/team/members', teamManagers, teamController.list);
teamRoutes.post('/team/members', teamManagers, teamController.invite);
teamRoutes.patch('/team/members/:userId', teamManagers, teamController.update);
teamRoutes.post('/team/members/:userId/invitation', teamManagers, teamController.resendInvitation);
