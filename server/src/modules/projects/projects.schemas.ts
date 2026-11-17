import { z } from 'zod';
import { PROJECT_STATUSES } from '../../shared/domain/enums.js';
import { AT_LEAST_ONE_FIELD, hasAtLeastOneField, nullableText, optionalText } from '../../shared/http/schemas.js';
import { createStageSchema } from '../stages/stages.schemas.js';

export const listProjectsQuerySchema = z.object({
  status: z.enum(PROJECT_STATUSES).optional(),
  /** `true` lista apenas os arquivados; por padrão eles ficam de fora. */
  archived: z
    .enum(['true', 'false'])
    .default('false')
    .transform((value) => value === 'true'),
});

export const createProjectSchema = z.object({
  name: z.string().trim().min(3).max(160),
  description: optionalText(5000),
  status: z.enum(PROJECT_STATUSES).default('PLANNING'),
  dueDate: z.iso.date().optional(),
  githubRepo: optionalText(200),
  githubUrl: optionalText(500),
  githubDefaultBranch: optionalText(100),
  githubToken: optionalText(300),
  /** Etapas iniciais do roadmap, na ordem em que serão executadas. */
  stages: z.array(createStageSchema).max(50).default([]),
  /** Ativa a primeira etapa na mesma transação da criação. */
  startFirstStage: z.boolean().default(false),
});

export const updateProjectSchema = z
  .object({
    name: z.string().trim().min(3).max(160).optional(),
    description: nullableText(5000),
    status: z.enum(PROJECT_STATUSES).optional(),
    dueDate: z.iso.date().nullable().optional(),
    githubRepo: nullableText(200),
    githubUrl: nullableText(500),
    githubDefaultBranch: nullableText(100),
    githubToken: nullableText(300),
  })
  .refine(hasAtLeastOneField, AT_LEAST_ONE_FIELD);

export type ListProjectsQuery = z.infer<typeof listProjectsQuerySchema>;
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
