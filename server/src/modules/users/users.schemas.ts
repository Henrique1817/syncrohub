import { z } from 'zod';
import { USER_ROLES } from '../../shared/domain/enums.js';

export const createUserSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z
    .email()
    .max(254)
    .transform((email) => email.toLowerCase()),
  // bcrypt considera apenas os primeiros 72 bytes.
  password: z.string().min(10).max(72),
  role: z.enum(USER_ROLES),
  positionTitle: z.string().trim().max(120).optional(),
});

export const listUsersQuerySchema = z.object({
  role: z.enum(USER_ROLES).optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
