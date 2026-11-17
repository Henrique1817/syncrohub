import { Router } from 'express';
import { engineerOnly } from '../../middlewares/authorize.js';
import * as githubController from './github.controller.js';

export const githubWebhookRoutes = Router();
githubWebhookRoutes.post('/webhooks/github', githubController.webhook);

export const githubRoutes = Router();
githubRoutes.post('/github/preview', engineerOnly, githubController.previewRepo);
githubRoutes.post('/projects/:projectId/github/sync', engineerOnly, githubController.syncProject);
