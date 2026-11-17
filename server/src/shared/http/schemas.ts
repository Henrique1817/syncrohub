import { z } from 'zod';

export const hasAtLeastOneField = (value: Record<string, unknown>) =>
  Object.values(value).some((field) => field !== undefined);

export const AT_LEAST_ONE_FIELD = { message: 'Informe ao menos um campo para atualizar.' } as const;

export const optionalText = (max: number) => z.string().trim().max(max).optional();

export const nullableText = (max: number) => z.string().trim().max(max).nullable().optional();
