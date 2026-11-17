/* Arquivo de middleware de autorização.
   authorize: Middleware de autorização.
   engineerOnly: Middleware de autorização para engenheiros.
   teamManagers: Middleware de autorização para gerentes de equipe.
   canCreateTasks: Middleware de autorização para criação de tasks.
*/

import type { RequestHandler } from 'express';
import { canManageTeam } from '../shared/domain/auth.js';
import type { UserRole } from '../shared/domain/enums.js';
import { forbidden } from '../shared/errors/app-error.js';
import { requireUser } from '../shared/http/request.js';

export function authorize(roles: readonly UserRole[], message?: string): RequestHandler {
  return (req, _res, next) => {
    const user = requireUser(req);
    if (!roles.includes(user.role)) throw forbidden(message);
    next();
  };
}

export const engineerOnly = authorize(['ENGINEER'], 'Apenas o Engenheiro responsável pode executar esta ação.');

export const teamManagers: RequestHandler = (req, _res, next) => {
  if (!canManageTeam(requireUser(req))) throw forbidden('Apenas o engenheiro e a Gerência gerenciam a equipe.');
  next();
};

/** Colaboradores acompanham e sugerem, mas (por enquanto) não abrem tasks/demandas. */
export const canCreateTasks = authorize(['ENGINEER', 'MANAGER'], 'Seu perfil pode enviar ideias e sugestões, mas ainda não pode criar tasks.');
