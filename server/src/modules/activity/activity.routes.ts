/* Arquivo de rotas de atividades.
   activityRoutes: Rotas de atividades.
*/

import { Router } from 'express';
import { engineerOnly } from '../../middlewares/authorize.js';
import * as activityController from './activity.controller.js';

export const activityRoutes = Router();

activityRoutes.get('/activity', activityController.list);
activityRoutes.get('/projects/:projectId/activity', activityController.listByProject);
activityRoutes.post('/projects/:projectId/updates', engineerOnly, activityController.postUpdate);
