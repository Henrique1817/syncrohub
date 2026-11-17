import type { RequestHandler } from 'express';
import { requireUser, uuidParam } from '../../shared/http/request.js';
import {
  approveIdeaSchema,
  changeIdeaStatusSchema,
  createIdeaSchema,
  ideaFeedbackSchema,
  listIdeasQuerySchema,
} from './ideas.schemas.js';
import * as ideasService from './ideas.service.js';

export const list: RequestHandler = async (req, res) => {
  const query = listIdeasQuerySchema.parse(req.query);
  res.json({ data: await ideasService.listIdeas(query) });
};

export const getById: RequestHandler = async (req, res) => {
  res.json({ data: await ideasService.getIdea(uuidParam(req, 'ideaId')) });
};

export const create: RequestHandler = async (req, res) => {
  const input = createIdeaSchema.parse(req.body);
  res.status(201).json({ data: await ideasService.submitIdea(requireUser(req), input) });
};

export const feedback: RequestHandler = async (req, res) => {
  const input = ideaFeedbackSchema.parse(req.body);
  res.json({ data: await ideasService.giveFeedback(requireUser(req), uuidParam(req, 'ideaId'), input) });
};

export const approve: RequestHandler = async (req, res) => {
  const input = approveIdeaSchema.parse(req.body);
  res.json({ data: await ideasService.approveIdea(requireUser(req), uuidParam(req, 'ideaId'), input) });
};

export const changeStatus: RequestHandler = async (req, res) => {
  const input = changeIdeaStatusSchema.parse(req.body);
  res.json({ data: await ideasService.changeIdeaStatus(requireUser(req), uuidParam(req, 'ideaId'), input) });
};
