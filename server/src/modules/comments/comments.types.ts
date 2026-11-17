import type { UserRole } from '../../shared/domain/enums.js';

export interface Comment {
  id: string;
  projectId: string;
  stageId: string | null;
  stageTitle: string | null;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  authorPositionTitle: string | null;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}
