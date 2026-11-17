/* Arquivo de controller de comentários.
   list: Controller de listagem de comentários.
   create: Controller de criação de comentário.
*/
import type { RequestHandler } from 'express';
import { requireUser, uuidParam } from '../../shared/http/request.js';
import { createCommentSchema, listCommentsQuerySchema } from './comments.schemas.js';
import * as commentsService from './comments.service.js';

/* Controller de listagem de comentários. */
export const list: RequestHandler = async (req, res) => {
  const query = listCommentsQuerySchema.parse(req.query);
  res.json({ data: await commentsService.listComments(uuidParam(req, 'projectId'), query) });
};

/* Controller de criação de comentário. */
export const create: RequestHandler = async (req, res) => {
  const input = createCommentSchema.parse(req.body);
  const comment = await commentsService.addComment(requireUser(req), uuidParam(req, 'projectId'), input);
  res.status(201).json({ data: comment });
};