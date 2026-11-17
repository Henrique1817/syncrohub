import { z } from 'zod';
import { DEPARTMENTS } from '../../shared/domain/enums.js';
import { AT_LEAST_ONE_FIELD, hasAtLeastOneField } from '../../shared/http/schemas.js';

export const inviteMemberSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z
    .email()
    .max(254)
    .transform((email) => email.toLowerCase()),
  department: z.enum(DEPARTMENTS),
  positionTitle: z.string().trim().max(120).optional(),
});

export const updateMemberSchema = z
  .object({
    name: z.string().trim().min(2).max(120).optional(),
    department: z.enum(DEPARTMENTS).optional(),
    positionTitle: z.string().trim().max(120).nullable().optional(),
    isActive: z.boolean().optional(),
  })
  .refine(hasAtLeastOneField, AT_LEAST_ONE_FIELD);

/** bcrypt considera apenas os primeiros 72 bytes. */
export const acceptInvitationSchema = z.object({
  password: z.string().min(10, 'A senha precisa ter ao menos 10 caracteres.').max(72),
});

export const invitationTokenSchema = z.string().min(20).max(200);

export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
export type UpdateMemberInput = z.infer<typeof updateMemberSchema>;
export type AcceptInvitationInput = z.infer<typeof acceptInvitationSchema>;
