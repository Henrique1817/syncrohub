import type { RequestHandler } from 'express';
import { requireUser, uuidParam } from '../../shared/http/request.js';
import { createProjectSchema, listProjectsQuerySchema, updateProjectSchema } from './projects.schemas.js';
import * as projectsService from './projects.service.js';

export const list: RequestHandler = async (req, res) => {
  const query = listProjectsQuerySchema.parse(req.query);
  res.json({ data: await projectsService.listProjects(query) });
};

export const getById: RequestHandler = async (req, res) => {
  res.json({ data: await projectsService.getProject(uuidParam(req, 'projectId')) });
};

export const create: RequestHandler = async (req, res) => {
  const input = createProjectSchema.parse(req.body);
  res.status(201).json({ data: await projectsService.createProject(requireUser(req), input) });
};

export const update: RequestHandler = async (req, res) => {
  const patch = updateProjectSchema.parse(req.body);
  res.json({ data: await projectsService.updateProject(requireUser(req), uuidParam(req, 'projectId'), patch) });
};

export const archive: RequestHandler = async (req, res) => {
  res.json({ data: await projectsService.setProjectArchived(requireUser(req), uuidParam(req, 'projectId'), true) });
};

export const restore: RequestHandler = async (req, res) => {
  res.json({ data: await projectsService.setProjectArchived(requireUser(req), uuidParam(req, 'projectId'), false) });
};

export const remove: RequestHandler = async (req, res) => {
  await projectsService.deleteProject(requireUser(req), uuidParam(req, 'projectId'));
  res.status(204).end();
};
