/* Arquivo de tipos de atividades.
   ActivityLog: Interface para log de atividades.
   NewActivity: Interface para nova atividade.
*/

import type { ActivityAction, UserRole } from '../../shared/domain/enums.js';

/* Interface para log de atividades. */
export interface ActivityLog {
  id: string;
  projectId: string | null;
  projectName: string | null;
  userId: string | null;
  userName: string | null;
  userRole: UserRole | null;
  userPositionTitle: string | null;
  actionType: ActivityAction;
  description: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

/* Interface para nova atividade. */
export interface NewActivity {
  projectId: string | null;
  userId: string | null;
  actionType: ActivityAction;
  description: string;
  metadata?: Record<string, unknown>;
}
