import type { Department, InviteDeliveryStatus, UserRole } from '../../shared/domain/enums.js';

/** PENDING = convidado, ainda sem senha; DISABLED = acesso bloqueado pelo engenheiro. */
export type MemberStatus = 'PENDING' | 'ACTIVE' | 'DISABLED';

export interface LatestInvitation {
  id: string;
  createdAt: Date;
  expiresAt: Date;
  deliveryStatus: InviteDeliveryStatus;
  deliveryError: string | null;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: Department | null;
  positionTitle: string | null;
  isActive: boolean;
  status: MemberStatus;
  activatedAt: Date | null;
  createdAt: Date;
  latestInvitation: LatestInvitation | null;
}

export interface InvitationResult {
  member: TeamMember;
  invitation: {
    /** Devolvido só para o engenheiro, uma vez: permite compartilhar o link quando o e-mail não sai. */
    inviteUrl: string;
    expiresAt: Date;
    deliveryStatus: InviteDeliveryStatus;
    deliveryError: string | null;
  };
}

export interface InvitationPreview {
  name: string;
  email: string;
  department: Department | null;
  expiresAt: Date;
}
