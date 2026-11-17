import type { StageStatus } from '../../shared/domain/enums.js';

const STAGE_STATUS_RANK: Record<StageStatus, number> = { PENDING: 0, ACTIVE: 1, DONE: 2 };

export type StageTransition = 'ADVANCE' | 'REVERT' | 'NONE';

export function classifyStageTransition(from: StageStatus, to: StageStatus): StageTransition {
  const delta = STAGE_STATUS_RANK[to] - STAGE_STATUS_RANK[from];
  if (delta > 0) return 'ADVANCE';
  if (delta < 0) return 'REVERT';
  return 'NONE';
}
