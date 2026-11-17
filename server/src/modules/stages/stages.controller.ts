import type { RequestHandler } from 'express';
import { requireUser, uuidParam } from '../../shared/http/request.js';
import {
  changeStageStatusSchema,
  createStageSchema,
  reorderStagesSchema,
  updateStageSchema,
} from './stages.schemas.js';
import * as stagesService from './stages.service.js';

export const list: RequestHandler = async (req, res) => {
  res.json({ data: await stagesService.listStages(uuidParam(req, 'projectId')) });
};

export const create: RequestHandler = async (req, res) => {
  const input = createStageSchema.parse(req.body);
  const stage = await stagesService.createStage(requireUser(req), uuidParam(req, 'projectId'), input);
  res.status(201).json({ data: stage });
};

export const update: RequestHandler = async (req, res) => {
  const patch = updateStageSchema.parse(req.body);
  res.json({ data: await stagesService.updateStage(requireUser(req), uuidParam(req, 'stageId'), patch) });
};

export const changeStatus: RequestHandler = async (req, res) => {
  const input = changeStageStatusSchema.parse(req.body);
  res.json({ data: await stagesService.changeStageStatus(requireUser(req), uuidParam(req, 'stageId'), input) });
};

export const reorder: RequestHandler = async (req, res) => {
  const input = reorderStagesSchema.parse(req.body);
  res.json({ data: await stagesService.reorderStages(requireUser(req), uuidParam(req, 'projectId'), input) });
};

export const remove: RequestHandler = async (req, res) => {
  await stagesService.deleteStage(requireUser(req), uuidParam(req, 'stageId'));
  res.status(204).end();
};
