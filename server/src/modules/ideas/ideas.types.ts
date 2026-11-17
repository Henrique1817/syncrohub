import type { Department, IdeaCategory, IdeaStatus } from '../../shared/domain/enums.js';

export interface Idea {
  id: string;
  projectId: string | null;
  projectName: string | null;
  authorId: string;
  authorName: string;
  authorPositionTitle: string | null;
  authorDepartment: Department | null;
  category: IdeaCategory;
  title: string;
  content: string;
  status: IdeaStatus;
  engineerFeedback: string | null;
  reviewedBy: string | null;
  reviewedAt: Date | null;
  /** Task gerada quando a ideia foi aprovada. */
  convertedTaskId: string | null;
  createdAt: Date;
  updatedAt: Date;
}
