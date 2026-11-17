import type { Department, IdeaStatus, ProjectStatus, StageStatus, TaskStatus } from './enums.js';

export const DEPARTMENT_LABEL: Record<Department, string> = {
  PURCHASING: 'Compras',
  FINANCE: 'Financeiro',
  SALES: 'Comercial',
  BILLING: 'Faturamento',
  TECHNOLOGY: 'Tecnologia',
  MANAGEMENT: 'Gerência',
};

export const PROJECT_STATUS_LABEL: Record<ProjectStatus, string> = {
  PLANNING: 'Planejamento',
  IN_PROGRESS: 'Em andamento',
  REVIEW: 'Em revisão',
  COMPLETED: 'Concluído',
};

export const STAGE_STATUS_LABEL: Record<StageStatus, string> = {
  PENDING: 'Pendente',
  ACTIVE: 'Em andamento',
  DONE: 'Concluída',
};

export const TASK_STATUS_LABEL: Record<TaskStatus, string> = {
  BACKLOG: 'Triagem',
  TODO: 'A fazer',
  IN_PROGRESS: 'Em andamento',
  DONE: 'Concluída',
};

export const IDEA_STATUS_LABEL: Record<IdeaStatus, string> = {
  UNDER_REVIEW: 'Em análise',
  APPROVED: 'Aprovada',
  IMPLEMENTED: 'Implementada',
  ARCHIVED: 'Arquivada',
};
