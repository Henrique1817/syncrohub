import { Router } from 'express';
import { authenticate } from './middlewares/authenticate.js';
import { activityRoutes } from './modules/activity/activity.routes.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { commentsRoutes } from './modules/comments/comments.routes.js';
import { ideasRoutes } from './modules/ideas/ideas.routes.js';
import { projectsRoutes } from './modules/projects/projects.routes.js';
import { stagesRoutes } from './modules/stages/stages.routes.js';
import { tasksRoutes } from './modules/tasks/tasks.routes.js';
import { invitationRoutes, teamRoutes } from './modules/team/team.routes.js';
import { usersRoutes } from './modules/users/users.routes.js';

export const apiRouter = Router();

apiRouter.use(authRoutes);
apiRouter.use(invitationRoutes);

apiRouter.use(authenticate);
apiRouter.use(usersRoutes);
apiRouter.use(teamRoutes);
apiRouter.use(projectsRoutes);
apiRouter.use(stagesRoutes);
apiRouter.use(tasksRoutes);
apiRouter.use(ideasRoutes);
apiRouter.use(commentsRoutes);
apiRouter.use(activityRoutes);
