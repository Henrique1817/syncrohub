import { z } from 'zod';
import { TASK_PRIORITIES, TASK_SOURCES, TASK_STATUSES } from '../../shared/domain/enums.js';
import { AT_LEAST_ONE_FIELD, hasAtLeastOneField, nullableText, optionalText } from '../../shared/http/schemas.js';

const workingStatus = z.enum(['TODO', 'IN_PROGRESS']);

const hasValidDateRange = (value: { startDate?: string | null; dueDate?: string | null }) =>
  !value.startDate || !value.dueDate || value.startDate <= value.dueDate;

export const DATE_RANGE_MESSAGE = 'A data de início não pode ser posterior à data de entrega.';
const DATE_RANGE_ERROR = { message: DATE_RANGE_MESSAGE, path: ['dueDate'] };

/**
 * Para MANAGER, `status` e `assignedTo` são ignorados: toda demanda do gestor entra em
 * BACKLOG (triagem). `stageId` vale como sugestão e pode ser trocado pelo engenheiro na triagem.
 */
export const createTaskSchema = z.object({
  title: z.string().trim().min(3).max(200),
  description: optionalText(5000),
  priority: z.enum(TASK_PRIORITIES).default('MEDIUM'),
  stageId: z.uuid().optional(),
  assignedTo: z.uuid().optional(),
  status: workingStatus.optional(),
  startDate: z.iso.date().optional(),
  dueDate: z.iso.date().optional(),
}).refine(hasValidDateRange, DATE_RANGE_ERROR);

export const triageTaskSchema = z.object({
  stageId: z.uuid(),
  priority: z.enum(TASK_PRIORITIES).optional(),
  assignedTo: z.uuid().optional(),
  status: workingStatus.default('TODO'),
});

export const updateTaskSchema = z
  .object({
    title: z.string().trim().min(3).max(200).optional(),
    description: nullableText(5000),
    priority: z.enum(TASK_PRIORITIES).optional(),
    stageId: z.uuid().nullable().optional(),
    assignedTo: z.uuid().nullable().optional(),
    startDate: z.iso.date().nullable().optional(),
    dueDate: z.iso.date().nullable().optional(),
  })
  .refine(hasAtLeastOneField, AT_LEAST_ONE_FIELD)
  .refine(hasValidDateRange, DATE_RANGE_ERROR);

export const changeTaskStatusSchema = z.object({
  status: z.enum(TASK_STATUSES),
});

export const listTasksQuerySchema = z.object({
  status: z.enum(TASK_STATUSES).optional(),
  stageId: z.uuid().optional(),
  source: z.enum(TASK_SOURCES).optional(),
  assignedTo: z.uuid().optional(),
});

export const triageQueueQuerySchema = z.object({
  projectId: z.uuid().optional(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type TriageTaskInput = z.infer<typeof triageTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type ChangeTaskStatusInput = z.infer<typeof changeTaskStatusSchema>;
export type ListTasksQuery = z.infer<typeof listTasksQuerySchema>;
export type TriageQueueQuery = z.infer<typeof triageQueueQuerySchema>;
