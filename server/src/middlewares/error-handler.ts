/* Arquivo de middleware de tratamento de erros.
   notFoundHandler: Middleware de tratamento de erros para rotas não encontradas.
   errorHandler: Middleware de tratamento de erros para erros não tratados.
*/

import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';
import { logger } from '../config/logger.js';
import { AppError } from '../shared/errors/app-error.js';

/** Interface para erros do PostgreSQL. */
interface PgError {
  code: string;
  constraint?: string;
}

/** Interface para erros do HTTP. */
interface HttpClientError {
  status: number;
  message: string;
  expose?: boolean;
}

/** Map de erros do PostgreSQL. */
const PG_ERRORS: Record<string, { status: number; code: string; message: string }> = {
  '23505': { status: 409, code: 'CONFLICT', message: 'Já existe um registro com esses dados.' },
  '23503': {
    status: 422,
    code: 'INVALID_REFERENCE',
    message: 'Referência inválida: o registro relacionado não existe ou não pertence a este projeto.',
  },
  '23514': { status: 422, code: 'CONSTRAINT_VIOLATION', message: 'Os dados violam uma regra de integridade.' },
  '22P02': { status: 400, code: 'INVALID_INPUT', message: 'Formato de dado inválido.' },
};

/* Função para verificar se o erro é do PostgreSQL. */
function isPgError(err: unknown): err is PgError {
  return (
    typeof err === 'object' &&
    err !== null &&
    'severity' in err &&
    'code' in err &&
    typeof err.code === 'string' &&
    /^[0-9A-Z]{5}$/.test(err.code)
  );
}

/* Função para verificar se o erro é do HTTP. */
function isHttpClientError(err: unknown): err is HttpClientError {
  return (
    typeof err === 'object' &&
    err !== null &&
    'status' in err &&
    typeof err.status === 'number' &&
    err.status >= 400 &&
    err.status < 500
  );
}

/* Middleware de tratamento de erros para rotas não encontradas. */
export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(new AppError(404, 'ROUTE_NOT_FOUND', `Rota ${req.method} ${req.path} não encontrada.`));
};

/* Middleware de tratamento de erros para erros não tratados. */
/* Error 422: Dados inválidos.
- Error 409: Conflito.
- Error 400: Requisição inválida.
- Error 422: Dados inválidos.
- Error 404: Rota não encontrada.
- Error 500: Erro interno inesperado.
*/
export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: { code: err.code, message: err.message, details: err.details } });
    return;
  }

  if (err instanceof ZodError) {
    res.status(422).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Dados inválidos.',
        details: err.issues.map((issue) => ({ path: issue.path.map(String).join('.'), message: issue.message })),
      },
    });
    return;
  }

  if (isPgError(err)) {
    const mapped = PG_ERRORS[err.code];
    if (mapped) {
      res.status(mapped.status).json({
        error: { code: mapped.code, message: mapped.message, details: { constraint: err.constraint } },
      });
      return;
    }
  }

  if (isHttpClientError(err)) {
    res.status(err.status).json({
      error: { code: 'BAD_REQUEST', message: err.expose ? err.message : 'Requisição inválida.' },
    });
    return;
  }

  logger.error({ err, method: req.method, path: req.path }, 'Erro não tratado');
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Erro interno inesperado.' } });
};
