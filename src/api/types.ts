/**
 * Contrato da SyncroHub API (server/src). Datas chegam como string ISO; `dueDate` como 'YYYY-MM-DD'.
 * Mantenha em sincronia com `server/src/shared/domain/enums.ts` e os `*.types.ts` de cada módulo.
 */

/** COLLABORATOR: funcionário convidado; acompanha projetos e envia ideias, sem criar tasks. */
export type UserRole = 'ENGINEER' | 'MANAGER' | 'COLLABORATOR';
export type Department = 'PURCHASING' | 'FINANCE' | 'SALES' | 'BILLING' | 'TECHNOLOGY' | 'MANAGEMENT';
export type ProjectStatus = 'PLANNING' | 'IN_PROGRESS' | 'REVIEW' | 'COMPLETED';
export type StageStatus = 'PENDING' | 'ACTIVE' | 'DONE';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type TaskStatus = 'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'DONE';
export type TaskSource = 'ENGINEER' | 'MANAGER_REQUEST' | 'IDEA';
export type IdeaCategory = 'IDEA' | 'SUGGESTION' | 'ADJUSTMENT';
export type IdeaStatus = 'UNDER_REVIEW' | 'APPROVED' | 'IMPLEMENTED' | 'ARCHIVED';

export type ActivityAction =
  | 'PROJECT_CREATED'
  | 'PROJECT_UPDATED'
  | 'PROJECT_STATUS_CHANGED'
  | 'PROJECT_DELETED'
  | 'PROJECT_ARCHIVED'
  | 'PROJECT_RESTORED'
  | 'STAGE_CREATED'
  | 'STAGE_UPDATED'
  | 'STAGE_REORDERED'
  | 'STAGE_ADVANCED'
  | 'STAGE_REVERTED'
  | 'STAGE_DELETED'
  | 'TASK_CREATED'
  | 'TASK_TRIAGED'
  | 'TASK_UPDATED'
  | 'TASK_STATUS_CHANGED'
  | 'TASK_DELETED'
  | 'IDEA_SUBMITTED'
  | 'IDEA_FEEDBACK'
  | 'IDEA_APPROVED'
  | 'IDEA_STATUS_CHANGED'
  | 'COMMENT_ADDED'
  | 'ENGINEER_UPDATE'
  | 'GITHUB_COMMIT_APPLIED';

// ---------------------------------------------------------------------------
// Envelopes
// ---------------------------------------------------------------------------

export interface DataEnvelope<T> {
  data: T;
}

export interface CursorPage<T> {
  data: T[];
  nextCursor: string | null;
}

export interface ApiErrorBody {
  error: { code: string; message: string; details?: unknown };
}

// ---------------------------------------------------------------------------
// Entidades
// ---------------------------------------------------------------------------

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  positionTitle: string | null;
  department: Department | null;
}

export interface User extends AuthUser {
  isActive: boolean;
  createdAt: string;
}

export interface LoginResponse {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  user: User;
}

export interface Stage {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  orderIndex: number;
  status: StageStatus;
  dueDate: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StageWithStats extends Stage {
  totalTasks: number;
  doneTasks: number;
}

export interface StageStatusChangeResult {
  stage: Stage;
  activatedStage: Stage | null;
  projectProgress: number;
}

export interface CurrentStageSummary {
  id: string;
  title: string;
  status: StageStatus;
  orderIndex: number;
  dueDate: string | null;
}

export interface ProjectOverview {
  id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  progressPercentage: number;
  /** Entrega prevista, 'YYYY-MM-DD'. */
  dueDate: string | null;
  archivedAt: string | null;
  githubRepo: string | null;
  githubUrl: string | null;
  githubDefaultBranch: string | null;
  githubLastSyncedAt: string | null;
  hasGithubToken: boolean;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
  totalStages: number;
  doneStages: number;
  overdueStages: number;
  currentStage: CurrentStageSummary | null;
  openTasks: number;
  triageTasks: number;
  pendingManagerRequests: number;
}

export interface ProjectDetail extends ProjectOverview {
  stages: StageWithStats[];
}

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
  triagedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

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
  reviewedAt: string | null;
  convertedTaskId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityLog {
  /** bigint no Postgres: o driver `pg` serializa como string. */
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
  createdAt: string;
}

export type InviteDeliveryStatus = 'PENDING' | 'SENT' | 'NOT_CONFIGURED' | 'FAILED';
export type MemberStatus = 'PENDING' | 'ACTIVE' | 'DISABLED';

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: Department | null;
  positionTitle: string | null;
  isActive: boolean;
  status: MemberStatus;
  activatedAt: string | null;
  createdAt: string;
  latestInvitation: {
    id: string;
    createdAt: string;
    expiresAt: string;
    deliveryStatus: InviteDeliveryStatus;
    deliveryError: string | null;
  } | null;
}

export interface InvitationResult {
  member: TeamMember;
  invitation: {
    /** Só vem nesta resposta: o banco guarda apenas o hash do token. */
    inviteUrl: string;
    expiresAt: string;
    deliveryStatus: InviteDeliveryStatus;
    deliveryError: string | null;
  };
}

export interface InvitationPreview {
  name: string;
  email: string;
  department: Department | null;
  expiresAt: string;
}

// ---------------------------------------------------------------------------
// Payloads de entrada (body / query)
// ---------------------------------------------------------------------------

export interface InviteMemberInput {
  name: string;
  email: string;
  department: Department;
  positionTitle?: string;
}

export interface UpdateMemberInput {
  name?: string;
  department?: Department;
  positionTitle?: string | null;
  isActive?: boolean;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  priority?: TaskPriority;
  /** Para MANAGER é apenas uma sugestão: a demanda sempre entra em BACKLOG (triagem). */
  stageId?: string;
  assignedTo?: string;
  status?: 'TODO' | 'IN_PROGRESS';
  startDate?: string;
  dueDate?: string;
}

/** Só o engenheiro edita. `null` limpa o campo. */
export interface UpdateTaskInput {
  title?: string;
  description?: string | null;
  priority?: TaskPriority;
  stageId?: string | null;
  assignedTo?: string | null;
  startDate?: string | null;
  dueDate?: string | null;
}

export interface TriageTaskInput {
  stageId: string;
  priority?: TaskPriority;
  assignedTo?: string;
  status?: 'TODO' | 'IN_PROGRESS';
}

export interface ListTasksQuery {
  status?: TaskStatus;
  stageId?: string;
  source?: TaskSource;
  assignedTo?: string;
}

export interface CreateStageInput {
  title: string;
  description?: string;
  /** 'YYYY-MM-DD' */
  dueDate?: string;
}

export interface UpdateStageInput {
  title?: string;
  description?: string | null;
  dueDate?: string | null;
}

export interface CreateProjectInput {
  name: string;
  description?: string;
  status?: ProjectStatus;
  dueDate?: string;
  githubRepo?: string;
  githubUrl?: string;
  githubDefaultBranch?: string;
  githubToken?: string;
  /** Etapas iniciais, na ordem de execução (máx. 50). */
  stages?: CreateStageInput[];
  /** Ativa a primeira etapa na mesma transação. */
  startFirstStage?: boolean;
}

export interface UpdateProjectInput {
  name?: string;
  description?: string | null;
  status?: ProjectStatus;
  dueDate?: string | null;
  githubRepo?: string | null;
  githubUrl?: string | null;
  githubDefaultBranch?: string | null;
  githubToken?: string | null;
}

export interface GitHubPreviewResult {
  name: string;
  githubRepo: string;
  githubUrl: string;
  defaultBranch: string;
  description: string | null;
}

export interface GitHubSyncTaskUpdate {
  taskId: string;
  taskTitle: string;
  from: TaskStatus;
  to: TaskStatus;
  commitSha: string;
  commitMessage: string;
}

export interface GitHubSyncResult {
  projectId: string;
  githubRepo: string;
  processedCommits: number;
  updatedTasks: GitHubSyncTaskUpdate[];
}

export interface CreateIdeaInput {
  projectId?: string;
  category: IdeaCategory;
  title: string;
  content: string;
}

export interface ListIdeasQuery {
  status?: IdeaStatus;
  category?: IdeaCategory;
  projectId?: string;
  authorId?: string;
}

export interface ApproveIdeaInput {
  /** Obrigatório quando a ideia foi enviada sem projeto. */
  projectId?: string;
  stageId: string;
  priority?: TaskPriority;
  assignedTo?: string;
  taskTitle?: string;
  feedback?: string;
}

export interface ChangeIdeaStatusInput {
  status: Exclude<IdeaStatus, 'APPROVED'>;
  feedback?: string;
}

export interface ListActivityQuery {
  projectId?: string;
  cursor?: string;
  limit?: number;
}
