import type { Stage } from '../types';

/** Mesma regra da view `project_overview`: a etapa ativa ou, na falta dela, a próxima pendente. */
export function getCurrentStage<T extends Stage>(stages: T[]): T | undefined {
  const ordered = [...stages].sort((a, b) => a.orderIndex - b.orderIndex);
  return ordered.find((s) => s.status === 'ACTIVE') ?? ordered.find((s) => s.status === 'PENDING');
}

export function sortStages<T extends Stage>(stages: T[]): T[] {
  return [...stages].sort((a, b) => a.orderIndex - b.orderIndex);
}

export function stagePercent(stage: { status: Stage['status']; totalTasks: number; doneTasks: number }) {
  if (stage.status === 'DONE') return 100;
  return stage.totalTasks ? Math.round((stage.doneTasks / stage.totalTasks) * 100) : 0;
}
