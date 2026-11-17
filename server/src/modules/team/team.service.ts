import { createHash, randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { env } from '../../config/env.js';
import { pool } from '../../infra/db/pool.js';
import { withTransaction } from '../../infra/db/transaction.js';
import { sendEmail } from '../../infra/email/mailer.js';
import type { AuthUser } from '../../shared/domain/auth.js';
import type { Department } from '../../shared/domain/enums.js';
import { conflict, forbidden, notFound } from '../../shared/errors/app-error.js';
import { signAccessToken } from '../auth/token.js';
import * as usersRepository from '../users/users.repository.js';
import { toPublicUser } from '../users/users.types.js';
import { buildInvitationEmail } from './invitation-email.js';
import * as teamRepository from './team.repository.js';
import type { AcceptInvitationInput, InviteMemberInput, UpdateMemberInput } from './team.schemas.js';
import type { InvitationPreview, InvitationResult, TeamMember } from './team.types.js';

const BCRYPT_COST = 12;

const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

async function getMemberOrFail(userId: string): Promise<TeamMember> {
  const member = await teamRepository.findMemberById(pool, userId);
  if (!member) throw notFound('Funcionário não encontrado.');
  return member;
}

export function listMembers() {
  return teamRepository.listMembers(pool);
}

/**
 * Cria o convite em transação e envia o e-mail depois do commit: uma falha do provedor
 * não desfaz o cadastro, fica registrada no convite e pode ser reenviada.
 */
async function issueInvitation(
  inviter: AuthUser,
  member: { id: string; name: string; email: string; department: Department },
): Promise<InvitationResult['invitation']> {
  const token = randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + env.INVITE_TTL_HOURS * 3_600_000);

  const invitationId = await withTransaction(async (tx) => {
    await teamRepository.revokeOpenInvitations(tx, member.id);
    return teamRepository.insertInvitation(tx, {
      userId: member.id,
      tokenHash: hashToken(token),
      expiresAt,
      createdBy: inviter.id,
    });
  });

  const inviteUrl = `${env.APP_URL.replace(/\/$/, '')}/convite/${token}`;
  const email = buildInvitationEmail({
    name: member.name,
    department: member.department,
    inviterName: inviter.name,
    inviteUrl,
    validForDays: Math.round(env.INVITE_TTL_HOURS / 24),
  });

  const delivery = await sendEmail({ to: member.email, ...email, idempotencyKey: `team-invite/${invitationId}` });
  const deliveryError = delivery.status === 'FAILED' ? delivery.error : null;
  await teamRepository.setDelivery(pool, invitationId, delivery.status, deliveryError);

  return { inviteUrl, expiresAt, deliveryStatus: delivery.status, deliveryError };
}

export async function inviteMember(inviter: AuthUser, input: InviteMemberInput): Promise<InvitationResult> {
  if (await teamRepository.emailExists(pool, input.email)) {
    throw conflict('Já existe um usuário cadastrado com este e-mail.');
  }

  const userId = await teamRepository.insertCollaborator(pool, {
    name: input.name,
    email: input.email,
    department: input.department,
    positionTitle: input.positionTitle || null,
  });

  const invitation = await issueInvitation(inviter, {
    id: userId,
    name: input.name,
    email: input.email,
    department: input.department,
  });
  return { member: await getMemberOrFail(userId), invitation };
}

export async function resendInvitation(inviter: AuthUser, userId: string): Promise<InvitationResult> {
  const member = await getMemberOrFail(userId);
  if (member.status === 'ACTIVE') throw conflict('Este funcionário já ativou o acesso.');
  if (member.status === 'DISABLED') throw conflict('Reative o acesso deste funcionário antes de reenviar o convite.');
  if (!member.department) throw conflict('Defina o segmento do funcionário antes de reenviar o convite.');

  const invitation = await issueInvitation(inviter, {
    id: member.id,
    name: member.name,
    email: member.email,
    department: member.department,
  });
  return { member: await getMemberOrFail(userId), invitation };
}

export async function updateMember(actor: AuthUser, userId: string, patch: UpdateMemberInput): Promise<TeamMember> {
  const member = await getMemberOrFail(userId);
  const isSelf = member.id === actor.id;
  if (member.role === 'ENGINEER' && !isSelf) {
    throw forbidden('O perfil do engenheiro responsável só pode ser alterado por ele mesmo.');
  }

  // Nome e cargo são dados de perfil; segmento e ativação definem o que a pessoa acessa.
  const changesAccess = patch.department !== undefined || patch.isActive !== undefined;
  if (changesAccess && isSelf) {
    throw forbidden('Você não pode alterar o próprio acesso. Peça ao engenheiro responsável.');
  }
  if (changesAccess && member.role === 'MANAGER' && actor.role !== 'ENGINEER') {
    throw forbidden('Somente o engenheiro responsável altera o acesso de diretores.');
  }
  await teamRepository.updateMember(pool, userId, patch);
  return getMemberOrFail(userId);
}

export async function getInvitation(token: string): Promise<InvitationPreview> {
  const invitation = await teamRepository.findOpenInvitation(pool, hashToken(token));
  if (!invitation) throw notFound('Este convite é inválido, expirou ou já foi usado.');
  const { name, email, department, expiresAt } = invitation;
  return { name, email, department, expiresAt };
}

/** Define a senha e já devolve uma sessão, no mesmo formato do login. */
export async function acceptInvitation(token: string, { password }: AcceptInvitationInput) {
  const passwordHash = await bcrypt.hash(password, BCRYPT_COST);

  const email = await withTransaction(async (tx) => {
    const invitation = await teamRepository.findOpenInvitation(tx, hashToken(token), { forUpdate: true });
    if (!invitation) throw notFound('Este convite é inválido, expirou ou já foi usado.');
    await teamRepository.acceptInvitation(tx, { invitationId: invitation.invitationId, userId: invitation.userId, passwordHash });
    return invitation.email;
  });

  const user = (await usersRepository.findByEmailWithPassword(pool, email))!;
  return {
    accessToken: signAccessToken(user.id),
    tokenType: 'Bearer' as const,
    expiresIn: env.JWT_TTL_SECONDS,
    user: toPublicUser(user),
  };
}
