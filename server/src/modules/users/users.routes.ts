import { Router } from 'express';
import { engineerOnly } from '../../middlewares/authorize.js';
import * as usersController from './users.controller.js';

export const usersRoutes = Router();

usersRoutes.get('/users', usersController.list);
usersRoutes.post('/users', engineerOnly, usersController.create);
