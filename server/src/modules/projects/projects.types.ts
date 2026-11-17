import type { ProjectStatus, StageStatus } from '../../shared/domain/enums.js';
import type { StageWithStats } from '../stages/stages.types.js';

export interface Project {
  id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  progressPercentage: number;
  /** 'YYYY-MM-DD' */
  dueDate: string | null;
  archivedAt: Date | null;
  githubRepo: string | null;
  githubUrl: string | null;
  githubDefaultBranch: string | null;
  githubLastSyncedAt: Date | null;
  hasGithubToken: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CurrentStageSummary {
  id: string;
  title: string;
  status: StageStatus;
  orderIndex: number;
  dueDate: string | null;
}

export interface ProjectOverview extends Project {
  createdByName: string;
  totalStages: number;
  doneStages: number;
  overdueStages: number;
  /** Etapa ativa ou, se nenhuma estiver ativa, a próxima pendente. `null` quando todas foram concluídas. */
  currentStage: CurrentStageSummary | null;
  openTasks: number;
  triageTasks: number;
  pendingManagerRequests: number;
}

export interface ProjectDetail extends ProjectOverview {
  stages: StageWithStats[];
}
