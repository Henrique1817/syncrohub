import type { TaskPriority, TaskSource, TaskStatus, UserRole } from '../../shared/domain/enums.js';

export interface Task {
  id: string;
  projectId: string;
  stageId: string | null;
  stageTitle: string | null;
  ideaId: string | null;
  title: string;
  description: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  source: TaskSource;
  createdBy: string;
  createdByName: string;
  createdByRole: UserRole;
  assignedTo: string | null;
  assignedToName: string | null;
  /** 'YYYY-MM-DD' */
  startDate: string | null;
  /** 'YYYY-MM-DD' */
  dueDate: string | null;
  triagedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
