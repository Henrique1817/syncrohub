import { useState } from 'react';
import { MailWarning, Pencil, RotateCw, Search, UserCheck, UserPlus, UserX, Users } from 'lucide-react';
import { EditMemberModal } from '../components/team/EditMemberModal';
import { InviteMemberModal } from '../components/team/InviteMemberModal';
import { InviteResultPanel } from '../components/team/InviteResultPanel';
import { Avatar } from '../components/ui/Avatar';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { compactSelectClass, inputClass } from '../components/ui/Field';
import { Modal } from '../components/ui/Modal';
import { EmptyState, ErrorState, PageLoader } from '../components/ui/States';
import { DELIVERY_STATUS_META, DEPARTMENTS, DEPARTMENT_META, MEMBER_STATUS_META, ROLE_META } from '../lib/constants';
import { canManageTeam } from '../lib/permissions';
import { cn, formatDate, relativeTime } from '../lib/utils';
import { useResendInvitation, useTeamMembers, useUpdateMember } from '../queries/team';
import { useCurrentUser } from '../store/session';
import { useUI } from '../store/ui';
import type { AuthUser, Department, InvitationResult, TeamMember } from '../types';

type DepartmentFilter = 'ALL' | Department;

interface MemberRowProps {
  member: TeamMember;
  viewer: AuthUser;
  onInvitationIssued: (result: InvitationResult) => void;
  onEdit: (member: TeamMember) => void;
}

function MemberRow({ member, viewer, onInvitationIssued, onEdit }: MemberRowProps) {
  const toast = useUI((s) => s.toast);
  const resend = useResendInvitation();
  const update = useUpdateMember();
  const status = MEMBER_STATUS_META[member.status];
  const invitation = member.latestInvitation;
  const isCollaborator = member.role === 'COLLABORATOR';
  const busy = resend.isPending || update.isPending;
  const isSelf = member.id === viewer.id;
  const canEditProfile = member.role !== 'ENGINEER' || isSelf;
  const lockedReason = isSelf
    ? 'Este é você'
    : member.role === 'ENGINEER'
      ? 'Engenheiro responsável'
      : member.role === 'MANAGER' && viewer.role !== 'ENGINEER'
        ? 'Gerido pelo engenheiro'
        : null;

  const setActive = (isActive: boolean) =>
    update.mutate(
      { userId: member.id, input: { isActive } },
      { onSuccess: () => toast(isActive ? 'Acesso reativado' : 'Acesso desativado', member.name) },
    );

  return (
    <li className={cn('flex flex-wrap items-center gap-x-4 gap-y-3 px-5 py-3.5', member.status === 'DISABLED' && 'opacity-60')}>
      <div className="flex min-w-0 flex-1 basis-56 items-center gap-3">
        <Avatar name={member.name} seed={member.id} size="md" />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-zinc-900">{member.name}</p>
          <p className="truncate text-xs text-zinc-500">{member.email}</p>
          {member.positionTitle && <p className="truncate text-[11px] text-zinc-400">{member.positionTitle}</p>}
        </div>
      </div>

      <div className="w-36">
        <select
          value={member.department ?? ''}
          disabled={busy || member.status === 'DISABLED' || Boolean(lockedReason)}
          onChange={(e) => {
            const department = e.target.value as Department;
            if (department && department !== member.department) {
              update.mutate({ userId: member.id, input: { department } }, { onSuccess: () => toast('Segmento atualizado', member.name) });
            }
          }}
          aria-label={`Segmento de ${member.name}`}
          className={cn(compactSelectClass, 'w-full')}
        >
          <option value="" disabled>
            Sem segmento
          </option>
          {DEPARTMENTS.map((value) => (
            <option key={value} value={value}>
              {DEPARTMENT_META[value].label}
            </option>
          ))}
        </select>
      </div>

      <div className="w-48 space-y-1">
        <div className="flex flex-wrap gap-1.5">
          <Badge tone={status.tone}>{status.label}</Badge>
          {!isCollaborator && <Badge tone={ROLE_META[member.role].tone}>{ROLE_META[member.role].label}</Badge>}
        </div>
        {member.status === 'PENDING' && invitation && (
          <p className="text-[11px] text-zinc-500">
            <span className={cn(invitation.deliveryStatus !== 'SENT' && 'font-medium text-amber-700')}>
              {DELIVERY_STATUS_META[invitation.deliveryStatus].label}
            </span>{' '}
            · {new Date(invitation.expiresAt) < new Date() ? 'expirado' : `expira ${formatDate(invitation.expiresAt)}`}
          </p>
        )}
        {member.status === 'ACTIVE' && member.activatedAt && (
          <p className="text-[11px] text-zinc-500">Ativo desde {formatDate(member.activatedAt)}</p>
        )}
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        {lockedReason && <span className="text-[11px] text-zinc-400">{lockedReason}</span>}
        {canEditProfile && (
          <Button variant="ghost" size="xs" icon={Pencil} disabled={busy} onClick={() => onEdit(member)}>
            Editar
          </Button>
        )}
        {!lockedReason && member.status === 'PENDING' && (
          <Button
            variant="secondary"
            size="xs"
            icon={RotateCw}
            disabled={busy}
            onClick={() => resend.mutate(member.id, { onSuccess: onInvitationIssued })}
          >
            {resend.isPending ? 'Reenviando…' : 'Reenviar convite'}
          </Button>
        )}
        {!lockedReason &&
          (member.status !== 'DISABLED' ? (
            <Button variant="danger" size="xs" icon={UserX} disabled={busy} onClick={() => setActive(false)}>
              Desativar
            </Button>
          ) : (
            <Button variant="ghost" size="xs" icon={UserCheck} disabled={busy} onClick={() => setActive(true)}>
              Reativar
            </Button>
          ))}
      </div>
    </li>
  );
}

export function TeamView() {
  const user = useCurrentUser();
  const allowed = canManageTeam(user);
  const members = useTeamMembers(allowed);
  const [filter, setFilter] = useState<DepartmentFilter>('ALL');
  const [search, setSearch] = useState('');
  const [inviting, setInviting] = useState(false);
  const [issued, setIssued] = useState<InvitationResult | null>(null);
  const [editing, setEditing] = useState<TeamMember | null>(null);

  if (!allowed) {
    return (
      <div className="mx-auto max-w-3xl p-8">
        <EmptyState title="Acesso restrito" description="Só o engenheiro responsável e a Gerência gerenciam a equipe do portal." />
      </div>
    );
  }

  const all = members.data ?? [];
  const term = search.trim().toLowerCase();
  const visible = all
    .filter((m) => filter === 'ALL' || m.department === filter)
    .filter((m) => !term || m.name.toLowerCase().includes(term) || m.email.toLowerCase().includes(term));
  const pendingWithoutEmail = all.filter(
    (m) => m.status === 'PENDING' && m.latestInvitation && m.latestInvitation.deliveryStatus !== 'SENT',
  ).length;

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">Equipe</h1>
          <p className="mt-1 max-w-xl text-sm text-zinc-500">
            Cadastre os funcionários por segmento. Cada um recebe um convite por e-mail para acompanhar os projetos e enviar
            ideias e sugestões.
          </p>
        </div>
        <Button icon={UserPlus} onClick={() => setInviting(true)}>
          Convidar funcionário
        </Button>
      </div>

      {pendingWithoutEmail > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-3 text-sm text-amber-900">
          <MailWarning className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <p>
            {pendingWithoutEmail === 1 ? '1 convite pendente não foi entregue' : `${pendingWithoutEmail} convites pendentes não foram entregues`}{' '}
            por e-mail. Configure RESEND_API_KEY no server/.env ou use "Reenviar convite" para gerar um link e enviar manualmente.
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {(['ALL', ...DEPARTMENTS] as DepartmentFilter[]).map((value) => {
            const count = value === 'ALL' ? all.length : all.filter((m) => m.department === value).length;
            const active = filter === value;
            return (
              <button
                key={value}
                onClick={() => setFilter(value)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition',
                  active ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-600 ring-1 ring-zinc-200 ring-inset hover:bg-zinc-50',
                )}
              >
                {value === 'ALL' ? 'Todos' : DEPARTMENT_META[value].label}
                <span className="text-zinc-400 tabular-nums">{count}</span>
              </button>
            );
          })}
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome ou e-mail"
            className={cn(inputClass, 'py-1.5 pl-8 text-xs')}
          />
        </div>
      </div>

      {members.isPending && <PageLoader label="Carregando equipe…" />}
      {members.isError && <ErrorState error={members.error} onRetry={() => void members.refetch()} />}

      {members.data &&
        (visible.length ? (
          <section className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xs">
            <header className="flex items-center gap-2 border-b border-zinc-100 px-5 py-3 text-xs text-zinc-500">
              <Users className="h-3.5 w-3.5" />
              {visible.length} {visible.length === 1 ? 'pessoa' : 'pessoas'}
              {filter !== 'ALL' && ` em ${DEPARTMENT_META[filter].label}`}
              <span className="ml-auto">
                Último convite {all.some((m) => m.latestInvitation) ? relativeTime(latestInviteDate(all)) : '—'}
              </span>
            </header>
            <ul className="divide-y divide-zinc-100">
              {visible.map((member) => (
                <MemberRow key={member.id} member={member} viewer={user} onInvitationIssued={setIssued} onEdit={setEditing} />
              ))}
            </ul>
          </section>
        ) : (
          <EmptyState
            title={all.length ? 'Ninguém encontrado' : 'Nenhum funcionário cadastrado'}
            description={all.length ? 'Ajuste o filtro ou a busca.' : 'Convide o primeiro funcionário para acompanhar os projetos.'}
            action={
              !all.length && (
                <Button icon={UserPlus} onClick={() => setInviting(true)}>
                  Convidar funcionário
                </Button>
              )
            }
          />
        ))}

      <InviteMemberModal open={inviting} onClose={() => setInviting(false)} />
      <EditMemberModal member={editing} onClose={() => setEditing(null)} />
      <Modal open={Boolean(issued)} onClose={() => setIssued(null)} size="lg">
        {issued && <InviteResultPanel result={issued} onClose={() => setIssued(null)} />}
      </Modal>
    </div>
  );
}

function latestInviteDate(members: TeamMember[]) {
  return members
    .map((m) => m.latestInvitation?.createdAt)
    .filter((date): date is string => Boolean(date))
    .sort()
    .at(-1)!;
}
