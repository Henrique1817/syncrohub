import { Router } from 'express';
import { canCreateTasks, engineerOnly } from '../../middlewares/authorize.js';
import * as tasksController from './tasks.controller.js';

export const tasksRoutes = Router();

tasksRoutes.get('/projects/:projectId/tasks', tasksController.listByProject);
tasksRoutes.post('/projects/:projectId/tasks', canCreateTasks, tasksController.create);

tasksRoutes.get('/tasks/triage', tasksController.triageQueue);
tasksRoutes.get('/tasks/:taskId', tasksController.getById);
tasksRoutes.post('/tasks/:taskId/triage', engineerOnly, tasksController.triage);
tasksRoutes.patch('/tasks/:taskId', engineerOnly, tasksController.update);
tasksRoutes.patch('/tasks/:taskId/status', engineerOnly, tasksController.changeStatus);
tasksRoutes.delete('/tasks/:taskId', engineerOnly, tasksController.remove);
