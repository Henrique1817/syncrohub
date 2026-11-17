import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi, teamApi } from '../api/endpoints';
import type { InviteMemberInput, UpdateMemberInput } from '../api/types';
import { useSession } from '../store/session';
import { queryKeys } from './keys';

export function useTeamMembers(enabled = true) {
  return useQuery({ queryKey: queryKeys.team, queryFn: ({ signal }) => teamApi.list(signal), enabled });
}

function useInvalidateTeam() {
  const queryClient = useQueryClient();
  // A lista de usuários alimenta nomes em ideias/pareceres: precisa refletir convites e desativações.
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.team }),
      queryClient.invalidateQueries({ queryKey: ['users'] }),
    ]);
}

export function useInviteMember() {
  const invalidate = useInvalidateTeam();
  return useMutation({
    mutationFn: (input: InviteMemberInput) => teamApi.invite(input),
    onSettled: invalidate,
    meta: { silentError: true },
  });
}

export function useResendInvitation() {
  const invalidate = useInvalidateTeam();
  return useMutation({
    mutationFn: (userId: string) => teamApi.resendInvitation(userId),
    onSettled: invalidate,
  });
}

export function useUpdateMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, input }: { userId: string; input: UpdateMemberInput }) => teamApi.update(userId, input),
    // Nome e cargo aparecem em projetos, tasks, ideias, atividade e na própria sessão (`me`).
    onSettled: () => queryClient.invalidateQueries(),
  });
}

export function useInvitation(token: string) {
  return useQuery({
    queryKey: queryKeys.invitation(token),
    queryFn: ({ signal }) => authApi.getInvitation(token, signal),
    retry: false,
  });
}

/** Ao aceitar, o funcionário já entra logado (mesmo formato de resposta do login). */
export function useAcceptInvitation(token: string) {
  const startSession = useSession((s) => s.startSession);
  return useMutation({
    mutationFn: (password: string) => authApi.acceptInvitation(token, password),
    onSuccess: startSession,
    meta: { silentError: true },
  });
}
