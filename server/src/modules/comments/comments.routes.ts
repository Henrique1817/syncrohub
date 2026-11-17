import { Router } from 'express';
import * as commentsController from './comments.controller.js';

export const commentsRoutes = Router();

commentsRoutes.get('/projects/:projectId/comments', commentsController.list);
commentsRoutes.post('/projects/:projectId/comments', commentsController.create);
