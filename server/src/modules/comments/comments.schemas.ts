import { z } from 'zod';

export const createCommentSchema = z.object({
  content: z.string().trim().min(1).max(5000),
  stageId: z.uuid().optional(),
});

export const listCommentsQuerySchema = z.object({
  stageId: z.uuid().optional(),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type ListCommentsQuery = z.infer<typeof listCommentsQuerySchema>;
