import { useSession } from '../store/session';
import type { ApiErrorBody, DataEnvelope } from './types';

const BASE_URL = import.meta.env.VITE_API_URL ?? '/api/v1';

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

type QueryValue = string | number | boolean | null | undefined;

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  query?: object;
  signal?: AbortSignal;
}

function buildUrl(path: string, query?: object) {
  const url = new URL(`${BASE_URL}${path}`, window.location.origin);
  for (const [key, value] of Object.entries(query ?? {}) as [string, QueryValue][]) {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value));
  }
  return url;
}

function isErrorBody(payload: unknown): payload is ApiErrorBody {
  return typeof payload === 'object' && payload !== null && 'error' in payload;
}

/** Faz a requisição e devolve o JSON cru. Lança `ApiError` para qualquer resposta fora de 2xx. */
export async function apiRequest<T>(path: string, { method = 'GET', body, query, signal }: RequestOptions = {}): Promise<T> {
  const token = useSession.getState().token;
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(buildUrl(path, query), {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err;
    throw new ApiError(0, 'NETWORK_ERROR', 'Não foi possível conectar à API. Verifique se o servidor está no ar.');
  }

  if (response.status === 204) return undefined as T;

  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    // Token expirado ou usuário desativado: encerra a sessão local para cair na tela de login.
    if (response.status === 401 && token) useSession.getState().logout();

    const error = isErrorBody(payload) ? payload.error : undefined;
    throw new ApiError(
      response.status,
      error?.code ?? 'HTTP_ERROR',
      error?.message ?? `Erro inesperado (${response.status}).`,
      error?.details,
    );
  }

  return payload as T;
}

/** Atalho para as rotas que respondem `{ data: T }`. */
export async function apiData<T>(path: string, options?: RequestOptions): Promise<T> {
  return (await apiRequest<DataEnvelope<T>>(path, options)).data;
}

export function getErrorMessage(error: unknown) {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return 'Algo deu errado.';
}
