import type { AuthUser, UserRole } from '../types';

/** Espelha `canCreateTasks` da API: colaboradores só enviam ideias e sugestões (por enquanto). */
export const canCreateTasks = (role: UserRole) => role === 'ENGINEER' || role === 'MANAGER';

export const isEngineer = (role: UserRole) => role === 'ENGINEER';

/** Espelha `canManageTeam` da API: o engenheiro e quem é do segmento Gerência. */
export const canManageTeam = (user: Pick<AuthUser, 'role' | 'department'>) =>
  user.role === 'ENGINEER' || user.department === 'MANAGEMENT';
