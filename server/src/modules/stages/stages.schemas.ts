import { z } from 'zod';
import { STAGE_STATUSES } from '../../shared/domain/enums.js';
import { AT_LEAST_ONE_FIELD, hasAtLeastOneField, nullableText, optionalText } from '../../shared/http/schemas.js';

export const createStageSchema = z.object({
  title: z.string().trim().min(2).max(160),
  description: optionalText(2000),
  dueDate: z.iso.date().optional(),
});

export const updateStageSchema = z
  .object({
    title: z.string().trim().min(2).max(160).optional(),
    description: nullableText(2000),
    dueDate: z.iso.date().nullable().optional(),
  })
  .refine(hasAtLeastOneField, AT_LEAST_ONE_FIELD);

export const changeStageStatusSchema = z.object({
  status: z.enum(STAGE_STATUSES),
  /** Ao concluir uma etapa, ativa automaticamente a próxima pendente (se nenhuma outra estiver ativa). */
  activateNext: z.boolean().default(true),
});

export const reorderStagesSchema = z.object({
  stageIds: z
    .array(z.uuid())
    .min(1)
    .refine((ids) => new Set(ids).size === ids.length, 'A lista contém etapas repetidas.'),
});

export type CreateStageInput = z.infer<typeof createStageSchema>;
export type UpdateStageInput = z.infer<typeof updateStageSchema>;
export type ChangeStageStatusInput = z.infer<typeof changeStageStatusSchema>;
export type ReorderStagesInput = z.infer<typeof reorderStagesSchema>;
