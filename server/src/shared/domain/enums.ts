export const USER_ROLES = ['ENGINEER', 'MANAGER', 'COLLABORATOR'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const DEPARTMENTS = ['PURCHASING', 'FINANCE', 'SALES', 'BILLING', 'TECHNOLOGY', 'MANAGEMENT'] as const;
export type Department = (typeof DEPARTMENTS)[number];

export const INVITE_DELIVERY_STATUSES = ['PENDING', 'SENT', 'NOT_CONFIGURED', 'FAILED'] as const;
export type InviteDeliveryStatus = (typeof INVITE_DELIVERY_STATUSES)[number];

export const PROJECT_STATUSES = ['PLANNING', 'IN_PROGRESS', 'REVIEW', 'COMPLETED'] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const STAGE_STATUSES = ['PENDING', 'ACTIVE', 'DONE'] as const;
export type StageStatus = (typeof STAGE_STATUSES)[number];

export const TASK_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export const TASK_STATUSES = ['BACKLOG', 'TODO', 'IN_PROGRESS', 'DONE'] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_SOURCES = ['ENGINEER', 'MANAGER_REQUEST', 'IDEA'] as const;
export type TaskSource = (typeof TASK_SOURCES)[number];

export const IDEA_CATEGORIES = ['IDEA', 'SUGGESTION', 'ADJUSTMENT'] as const;
export type IdeaCategory = (typeof IDEA_CATEGORIES)[number];

export const IDEA_STATUSES = ['UNDER_REVIEW', 'APPROVED', 'IMPLEMENTED', 'ARCHIVED'] as const;
export type IdeaStatus = (typeof IDEA_STATUSES)[number];

export const ACTIVITY_ACTIONS = [
  'PROJECT_CREATED',
  'PROJECT_UPDATED',
  'PROJECT_STATUS_CHANGED',
  'PROJECT_DELETED',
  'PROJECT_ARCHIVED',
  'PROJECT_RESTORED',
  'STAGE_CREATED',
  'STAGE_UPDATED',
  'STAGE_REORDERED',
  'STAGE_ADVANCED',
  'STAGE_REVERTED',
  'STAGE_DELETED',
  'TASK_CREATED',
  'TASK_TRIAGED',
  'TASK_UPDATED',
  'TASK_STATUS_CHANGED',
  'TASK_DELETED',
  'IDEA_SUBMITTED',
  'IDEA_FEEDBACK',
  'IDEA_APPROVED',
  'IDEA_STATUS_CHANGED',
  'COMMENT_ADDED',
  'ENGINEER_UPDATE',
] as const;
export type ActivityAction = (typeof ACTIVITY_ACTIONS)[number];
