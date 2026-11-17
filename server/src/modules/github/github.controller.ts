import type { Request, RequestHandler } from 'express';
import { requireUser, uuidParam } from '../../shared/http/request.js';
import { previewGitHubRepoSchema, syncGitHubProjectSchema } from './github.schemas.js';
import * as githubService from './github.service.js';

type RequestWithRawBody = Request & { rawBody?: Buffer };

export const previewRepo: RequestHandler = async (req, res) => {
  const input = previewGitHubRepoSchema.parse(req.body);
  res.json({ data: await githubService.previewGitHubRepo(input.repo, input.token) });
};

export const syncProject: RequestHandler = async (req, res) => {
  const input = syncGitHubProjectSchema.parse(req.body ?? {});
  res.json({
    data: await githubService.syncProjectFromGitHub(requireUser(req), uuidParam(req, 'projectId'), input.token),
  });
};

export const webhook: RequestHandler = async (req, res) => {
  const rawBody = (req as RequestWithRawBody).rawBody;
  const signature = req.header('x-hub-signature-256');
  const event = req.header('x-github-event');

  res.json({ data: await githubService.handleGitHubWebhook(rawBody, signature, event, req.body) });
};
