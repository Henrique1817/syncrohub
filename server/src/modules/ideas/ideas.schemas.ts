import { z } from 'zod';
import { IDEA_CATEGORIES, IDEA_STATUSES, TASK_PRIORITIES } from '../../shared/domain/enums.js';
import { optionalText } from '../../shared/http/schemas.js';

export const createIdeaSchema = z.object({
  projectId: z.uuid().optional(),
  category: z.enum(IDEA_CATEGORIES),
  title: z.string().trim().min(3).max(200),
  content: z.string().trim().min(3).max(5000),
});

export const listIdeasQuerySchema = z.object({
  status: z.enum(IDEA_STATUSES).optional(),
  category: z.enum(IDEA_CATEGORIES).optional(),
  projectId: z.uuid().optional(),
  authorId: z.uuid().optional(),
});

export const ideaFeedbackSchema = z.object({
  feedback: z.string().trim().min(2).max(5000),
});

/** Aprovar = converter em task real vinculada a uma etapa. */
export const approveIdeaSchema = z.object({
  /** Obrigatório quando a ideia foi enviada sem projeto. */
  projectId: z.uuid().optional(),
  stageId: z.uuid(),
  priority: z.enum(TASK_PRIORITIES).default('MEDIUM'),
  assignedTo: z.uuid().optional(),
  /** Título técnico da task; por padrão usa o título da ideia. */
  taskTitle: z.string().trim().min(3).max(200).optional(),
  feedback: optionalText(5000),
});

/** APPROVED só é alcançado via /approve, que também cria a task. */
export const changeIdeaStatusSchema = z.object({
  status: z.enum(['UNDER_REVIEW', 'IMPLEMENTED', 'ARCHIVED']),
  feedback: optionalText(5000),
});

export type CreateIdeaInput = z.infer<typeof createIdeaSchema>;
export type ListIdeasQuery = z.infer<typeof listIdeasQuerySchema>;
export type IdeaFeedbackInput = z.infer<typeof ideaFeedbackSchema>;
export type ApproveIdeaInput = z.infer<typeof approveIdeaSchema>;
export type ChangeIdeaStatusInput = z.infer<typeof changeIdeaStatusSchema>;
