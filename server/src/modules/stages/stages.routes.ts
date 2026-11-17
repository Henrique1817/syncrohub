import { Router } from 'express';
import { engineerOnly } from '../../middlewares/authorize.js';
import * as stagesController from './stages.controller.js';

export const stagesRoutes = Router();

stagesRoutes.get('/projects/:projectId/stages', stagesController.list);
stagesRoutes.post('/projects/:projectId/stages', engineerOnly, stagesController.create);
stagesRoutes.put('/projects/:projectId/stages/order', engineerOnly, stagesController.reorder);
stagesRoutes.patch('/stages/:stageId', engineerOnly, stagesController.update);
stagesRoutes.patch('/stages/:stageId/status', engineerOnly, stagesController.changeStatus);
stagesRoutes.delete('/stages/:stageId', engineerOnly, stagesController.remove);
