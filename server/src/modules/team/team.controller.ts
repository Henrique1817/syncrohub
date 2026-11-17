import type { RequestHandler } from 'express';
import { badRequest } from '../../shared/errors/app-error.js';
import { requireUser, uuidParam } from '../../shared/http/request.js';
import { acceptInvitationSchema, invitationTokenSchema, inviteMemberSchema, updateMemberSchema } from './team.schemas.js';
import * as teamService from './team.service.js';

function tokenParam(token: unknown): string {
  const parsed = invitationTokenSchema.safeParse(token);
  if (!parsed.success) throw badRequest('Link de convite inválido.');
  return parsed.data;
}

export const list: RequestHandler = async (_req, res) => {
  res.json({ data: await teamService.listMembers() });
};

export const invite: RequestHandler = async (req, res) => {
  const input = inviteMemberSchema.parse(req.body);
  res.status(201).json({ data: await teamService.inviteMember(requireUser(req), input) });
};

export const update: RequestHandler = async (req, res) => {
  const patch = updateMemberSchema.parse(req.body);
  res.json({ data: await teamService.updateMember(requireUser(req), uuidParam(req, 'userId'), patch) });
};

export const resendInvitation: RequestHandler = async (req, res) => {
  res.json({ data: await teamService.resendInvitation(requireUser(req), uuidParam(req, 'userId')) });
};

export const getInvitation: RequestHandler = async (req, res) => {
  res.json({ data: await teamService.getInvitation(tokenParam(req.params.token)) });
};

export const acceptInvitation: RequestHandler = async (req, res) => {
  const input = acceptInvitationSchema.parse(req.body);
  res.json({ data: await teamService.acceptInvitation(tokenParam(req.params.token), input) });
};
