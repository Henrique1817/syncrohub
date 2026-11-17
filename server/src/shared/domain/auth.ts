import type { Department, UserRole } from './enums.js';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  positionTitle: string | null;
  department: Department | null;
}

/** A equipe é gerida pelo engenheiro e por quem é do segmento Gerência. */
export const canManageTeam = (user: Pick<AuthUser, 'role' | 'department'>) =>
  user.role === 'ENGINEER' || user.department === 'MANAGEMENT';
