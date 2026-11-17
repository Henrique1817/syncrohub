import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthUser, LoginResponse } from '../api/types';

interface SessionState {
  token: string | null;
  user: AuthUser | null;
  /** Epoch em ms; derivado de `expiresIn` no login. */
  expiresAt: number | null;
  startSession: (response: LoginResponse) => void;
  setUser: (user: AuthUser) => void;
  logout: () => void;
}

const EMPTY = { token: null, user: null, expiresAt: null };

export const useSession = create<SessionState>()(
  persist(
    (set) => ({
      ...EMPTY,
      startSession: ({ accessToken, expiresIn, user }) =>
        set({ token: accessToken, user, expiresAt: Date.now() + expiresIn * 1000 }),
      setUser: (user) => set({ user }),
      logout: () => set(EMPTY),
    }),
    {
      name: 'syncrohub.session',
      onRehydrateStorage: () => (state) => {
        if (state?.expiresAt && state.expiresAt <= Date.now()) state.logout();
      },
    },
  ),
);

/** Só deve ser usado dentro da área autenticada (o App garante que a sessão existe). */
export function useCurrentUser(): AuthUser {
  return useSession((s) => s.user)!;
}
