import { MutationCache, QueryClient } from '@tanstack/react-query';
import { ApiError, getErrorMessage } from '../api/client';
import { useUI } from '../store/ui';

declare module '@tanstack/react-query' {
  interface Register {
    defaultError: ApiError | Error;
    mutationMeta: {
      /** O próprio componente exibe o erro (ex.: formulários); evita toast duplicado. */
      silentError?: boolean;
    };
  }
}

const isClientError = (error: unknown) => error instanceof ApiError && error.status >= 400 && error.status < 500;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      // 4xx não se resolve tentando de novo (permissão, validação, não encontrado).
      retry: (failureCount, error) => !isClientError(error) && failureCount < 2,
    },
  },
  mutationCache: new MutationCache({
    onError: (error, _variables, _context, mutation) => {
      if (mutation.meta?.silentError) return;
      useUI.getState().toast('Não foi possível concluir a ação', getErrorMessage(error), 'error');
    },
  }),
});
