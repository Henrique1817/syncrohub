/* Arquivo de controller de atividades.
   list: Controller de listagem de atividades.
   listByProject: Controller de listagem de atividades por projeto.
   postUpdate: Controller de criação de atividade.
*/

import type { RequestHandler } from 'express';
import { requireUser, uuidParam } from '../../shared/http/request.js';
import { engineerUpdateSchema, listActivityQuerySchema } from './activity.schemas.js';
import * as activityService from './activity.service.js';

export const list: RequestHandler = async (req, res) => {
  const query = listActivityQuerySchema.parse(req.query);
  res.json(await activityService.listActivity(query));
};

export const listByProject: RequestHandler = async (req, res) => {
  const query = listActivityQuerySchema.parse({ ...req.query, projectId: uuidParam(req, 'projectId') });
  res.json(await activityService.listActivity(query));
};

export const postUpdate: RequestHandler = async (req, res) => {
  const input = engineerUpdateSchema.parse(req.body);
  const entry = await activityService.postEngineerUpdate(requireUser(req), uuidParam(req, 'projectId'), input);
  res.status(201).json({ data: entry });
};
