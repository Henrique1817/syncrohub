import type { Request } from 'express';
import { z } from 'zod';
import type { AuthUser } from '../domain/auth.js';
import { badRequest, unauthorized } from '../errors/app-error.js';

const uuidSchema = z.uuid();

export function requireUser(req: Request): AuthUser {
  if (!req.user) throw unauthorized();
  return req.user;
}

export function uuidParam(req: Request, name: string): string {
  const parsed = uuidSchema.safeParse(req.params[name]);
  if (!parsed.success) throw badRequest(`O parâmetro "${name}" deve ser um UUID válido.`);
  return parsed.data;
}
