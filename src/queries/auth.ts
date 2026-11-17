import { useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { authApi } from '../api/endpoints';
import { useSession } from '../store/session';
import { queryKeys } from './keys';

export function useLogin() {
  const startSession = useSession((s) => s.startSession);
  return useMutation({
    mutationFn: authApi.login,
    onSuccess: startSession,
    meta: { silentError: true },
  });
}

/**
 * Revalida a sessão persistida com GET /auth/me ao abrir o app.
 * Se o perfil mudou no servidor, o papel na interface acompanha; se o token expirou,
 * o cliente HTTP recebe 401 e faz logout sozinho.
 */
export function useSessionSync() {
  const token = useSession((s) => s.token);
  const setUser = useSession((s) => s.setUser);

  const query = useQuery({
    queryKey: queryKeys.me,
    queryFn: ({ signal }) => authApi.me(signal),
    enabled: Boolean(token),
    staleTime: 5 * 60_000,
  });

  useEffect(() => {
    if (query.data) setUser(query.data);
  }, [query.data, setUser]);
}
