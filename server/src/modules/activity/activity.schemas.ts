/* Arquivo de schemas de atividades.
   listActivityQuerySchema: Schema de consulta de atividades.
   engineerUpdateSchema: Schema de atualização de atividade.
*/

import { z } from 'zod';

/* Schema de consulta de atividades. */
export const listActivityQuerySchema = z.object({
  projectId: z.uuid().optional(),
  cursor: z
    .string()
    .regex(/^\d+$/, 'Cursor inválido.')
    .optional(),
  limit: z.coerce.number().int().min(1).max(100).default(30),
});

/* Schema de atualização de atividade. */
export const engineerUpdateSchema = z.object({
  title: z.string().trim().min(3).max(200),
  content: z.string().trim().max(5000).optional(),
  /** Indicadores de performance livres, ex.: { "uptime": "99.9%", "deploys": 4 } */
  metrics: z.record(z.string().max(60), z.union([z.number(), z.string().max(200)])).optional(),
});

export type ListActivityQuery = z.infer<typeof listActivityQuerySchema>;
export type EngineerUpdateInput = z.infer<typeof engineerUpdateSchema>;
