import { Router } from 'express';
import { engineerOnly } from '../../middlewares/authorize.js';
import * as ideasController from './ideas.controller.js';

export const ideasRoutes = Router();

ideasRoutes.get('/ideas', ideasController.list);
ideasRoutes.post('/ideas', ideasController.create);
ideasRoutes.get('/ideas/:ideaId', ideasController.getById);
ideasRoutes.post('/ideas/:ideaId/feedback', engineerOnly, ideasController.feedback);
ideasRoutes.post('/ideas/:ideaId/approve', engineerOnly, ideasController.approve);
ideasRoutes.patch('/ideas/:ideaId/status', engineerOnly, ideasController.changeStatus);
