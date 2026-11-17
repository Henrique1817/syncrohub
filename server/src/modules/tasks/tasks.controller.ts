import type { RequestHandler } from 'express';
import { requireUser, uuidParam } from '../../shared/http/request.js';
import {
  changeTaskStatusSchema,
  createTaskSchema,
  listTasksQuerySchema,
  triageQueueQuerySchema,
  triageTaskSchema,
  updateTaskSchema,
} from './tasks.schemas.js';
import * as tasksService from './tasks.service.js';

export const listByProject: RequestHandler = async (req, res) => {
  const query = listTasksQuerySchema.parse(req.query);
  res.json({ data: await tasksService.listProjectTasks(uuidParam(req, 'projectId'), query) });
};

export const triageQueue: RequestHandler = async (req, res) => {
  const query = triageQueueQuerySchema.parse(req.query);
  res.json({ data: await tasksService.listTriageQueue(query) });
};

export const getById: RequestHandler = async (req, res) => {
  res.json({ data: await tasksService.getTask(uuidParam(req, 'taskId')) });
};

export const create: RequestHandler = async (req, res) => {
  const input = createTaskSchema.parse(req.body);
  const task = await tasksService.createTask(requireUser(req), uuidParam(req, 'projectId'), input);
  res.status(201).json({ data: task });
};

export const triage: RequestHandler = async (req, res) => {
  const input = triageTaskSchema.parse(req.body);
  res.json({ data: await tasksService.triageTask(requireUser(req), uuidParam(req, 'taskId'), input) });
};

export const update: RequestHandler = async (req, res) => {
  const patch = updateTaskSchema.parse(req.body);
  res.json({ data: await tasksService.updateTask(requireUser(req), uuidParam(req, 'taskId'), patch) });
};

export const changeStatus: RequestHandler = async (req, res) => {
  const input = changeTaskStatusSchema.parse(req.body);
  res.json({ data: await tasksService.changeTaskStatus(requireUser(req), uuidParam(req, 'taskId'), input) });
};

export const remove: RequestHandler = async (req, res) => {
  await tasksService.deleteTask(requireUser(req), uuidParam(req, 'taskId'));
  res.status(204).end();
};
