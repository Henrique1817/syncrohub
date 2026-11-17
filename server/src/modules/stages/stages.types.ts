import type { StageStatus } from '../../shared/domain/enums.js';

export interface Stage {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  orderIndex: number;
  status: StageStatus;
  dueDate: string | null;
  startedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface StageWithStats extends Stage {
  totalTasks: number;
  doneTasks: number;
}

export interface StageStatusChangeResult {
  stage: Stage;
  /** Próxima etapa ativada automaticamente ao concluir a atual, se houver. */
  activatedStage: Stage | null;
  projectProgress: number;
}
