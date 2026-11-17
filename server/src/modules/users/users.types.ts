import type { Department, UserRole } from '../../shared/domain/enums.js';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  positionTitle: string | null;
  department: Department | null;
  isActive: boolean;
  createdAt: Date;
}

export interface UserWithPassword extends User {
  /** `null` enquanto o convite não foi aceito. */
  passwordHash: string | null;
}

export function toPublicUser({ passwordHash: _omit, ...user }: UserWithPassword): User {
  return user;
}
