import type { RequestHandler } from 'express';
import { createUserSchema, listUsersQuerySchema } from './users.schemas.js';
import * as usersService from './users.service.js';

export const list: RequestHandler = async (req, res) => {
  const filter = listUsersQuerySchema.parse(req.query);
  res.json({ data: await usersService.listUsers(filter) });
};

export const create: RequestHandler = async (req, res) => {
  const input = createUserSchema.parse(req.body);
  res.status(201).json({ data: await usersService.createUser(input) });
};
