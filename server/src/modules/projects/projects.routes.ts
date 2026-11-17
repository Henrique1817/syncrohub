import { Router } from 'express';
import { engineerOnly } from '../../middlewares/authorize.js';
import * as projectsController from './projects.controller.js';

export const projectsRoutes = Router();

projectsRoutes.get('/projects', projectsController.list);
projectsRoutes.get('/projects/:projectId', projectsController.getById);
projectsRoutes.post('/projects', engineerOnly, projectsController.create);
projectsRoutes.patch('/projects/:projectId', engineerOnly, projectsController.update);
projectsRoutes.post('/projects/:projectId/archive', engineerOnly, projectsController.archive);
projectsRoutes.post('/projects/:projectId/restore', engineerOnly, projectsController.restore);
projectsRoutes.delete('/projects/:projectId', engineerOnly, projectsController.remove);
