import { apiData, apiRequest } from './client';
import type {
  ActivityLog,
  ApproveIdeaInput,
  AuthUser,
  ChangeIdeaStatusInput,
  CreateIdeaInput,
  CreateProjectInput,
  CreateStageInput,
  CreateTaskInput,
  CursorPage,
  Idea,
  InvitationPreview,
  InvitationResult,
  InviteMemberInput,
  ListActivityQuery,
  ListIdeasQuery,
  ListTasksQuery,
  LoginInput,
  LoginResponse,
  ProjectDetail,
  ProjectOverview,
  ProjectStatus,
  StageStatus,
  StageStatusChangeResult,
  StageWithStats,
  Stage,
  Task,
  TaskStatus,
  TeamMember,
  TriageTaskInput,
  UpdateMemberInput,
  UpdateProjectInput,
  UpdateStageInput,
  UpdateTaskInput,
  User,
  UserRole,
} from './types';

export const authApi = {
  login: (input: LoginInput) => apiData<LoginResponse>('/auth/login', { method: 'POST', body: input }),
  me: (signal?: AbortSignal) => apiData<AuthUser>('/auth/me', { signal }),
  getInvitation: (token: string, signal?: AbortSignal) =>
    apiData<InvitationPreview>(`/auth/invitations/${encodeURIComponent(token)}`, { signal }),
  acceptInvitation: (token: string, password: string) =>
    apiData<LoginResponse>(`/auth/invitations/${encodeURIComponent(token)}/accept`, {
      method: 'POST',
      body: { password },
    }),
};

export const teamApi = {
  list: (signal?: AbortSignal) => apiData<TeamMember[]>('/team/members', { signal }),
  invite: (input: InviteMemberInput) => apiData<InvitationResult>('/team/members', { method: 'POST', body: input }),
  update: (userId: string, input: UpdateMemberInput) =>
    apiData<TeamMember>(`/team/members/${userId}`, { method: 'PATCH', body: input }),
  resendInvitation: (userId: string) =>
    apiData<InvitationResult>(`/team/members/${userId}/invitation`, { method: 'POST' }),
};

export const usersApi = {
  list: (role?: UserRole, signal?: AbortSignal) => apiData<User[]>('/users', { query: { role }, signal }),
};

export const projectsApi = {
  list: (query: { status?: ProjectStatus; archived?: boolean } = {}, signal?: AbortSignal) =>
    apiData<ProjectOverview[]>('/projects', { query, signal }),
  get: (projectId: string, signal?: AbortSignal) => apiData<ProjectDetail>(`/projects/${projectId}`, { signal }),
  create: (input: CreateProjectInput) => apiData<ProjectDetail>('/projects', { method: 'POST', body: input }),
  update: (projectId: string, input: UpdateProjectInput) =>
    apiData<ProjectDetail>(`/projects/${projectId}`, { method: 'PATCH', body: input }),
  archive: (projectId: string) => apiData<ProjectDetail>(`/projects/${projectId}/archive`, { method: 'POST' }),
  restore: (projectId: string) => apiData<ProjectDetail>(`/projects/${projectId}/restore`, { method: 'POST' }),
  remove: (projectId: string) => apiRequest<void>(`/projects/${projectId}`, { method: 'DELETE' }),
};

export const stagesApi = {
  create: (projectId: string, input: CreateStageInput) =>
    apiData<Stage>(`/projects/${projectId}/stages`, { method: 'POST', body: input }),
  update: (stageId: string, input: UpdateStageInput) =>
    apiData<Stage>(`/stages/${stageId}`, { method: 'PATCH', body: input }),
  remove: (stageId: string) => apiRequest<void>(`/stages/${stageId}`, { method: 'DELETE' }),
  reorder: (projectId: string, stageIds: string[]) =>
    apiData<StageWithStats[]>(`/projects/${projectId}/stages/order`, { method: 'PUT', body: { stageIds } }),
  changeStatus: (stageId: string, status: StageStatus, activateNext = true) =>
    apiData<StageStatusChangeResult>(`/stages/${stageId}/status`, { method: 'PATCH', body: { status, activateNext } }),
};

export const tasksApi = {
  listByProject: (projectId: string, query?: ListTasksQuery, signal?: AbortSignal) =>
    apiData<Task[]>(`/projects/${projectId}/tasks`, { query, signal }),
  triageQueue: (projectId?: string, signal?: AbortSignal) =>
    apiData<Task[]>('/tasks/triage', { query: { projectId }, signal }),
  get: (taskId: string, signal?: AbortSignal) => apiData<Task>(`/tasks/${taskId}`, { signal }),
  create: (projectId: string, input: CreateTaskInput) =>
    apiData<Task>(`/projects/${projectId}/tasks`, { method: 'POST', body: input }),
  triage: (taskId: string, input: TriageTaskInput) =>
    apiData<Task>(`/tasks/${taskId}/triage`, { method: 'POST', body: input }),
  update: (taskId: string, input: UpdateTaskInput) =>
    apiData<Task>(`/tasks/${taskId}`, { method: 'PATCH', body: input }),
  changeStatus: (taskId: string, status: TaskStatus) =>
    apiData<Task>(`/tasks/${taskId}/status`, { method: 'PATCH', body: { status } }),
};

export const ideasApi = {
  list: (query?: ListIdeasQuery, signal?: AbortSignal) => apiData<Idea[]>('/ideas', { query, signal }),
  create: (input: CreateIdeaInput) => apiData<Idea>('/ideas', { method: 'POST', body: input }),
  feedback: (ideaId: string, feedback: string) =>
    apiData<Idea>(`/ideas/${ideaId}/feedback`, { method: 'POST', body: { feedback } }),
  approve: (ideaId: string, input: ApproveIdeaInput) =>
    apiData<{ idea: Idea; task: Task }>(`/ideas/${ideaId}/approve`, { method: 'POST', body: input }),
  changeStatus: (ideaId: string, input: ChangeIdeaStatusInput) =>
    apiData<Idea>(`/ideas/${ideaId}/status`, { method: 'PATCH', body: input }),
};

export const activityApi = {
  /** Única rota paginada: devolve `{ data, nextCursor }` em vez de só `{ data }`. */
  list: ({ projectId, ...query }: ListActivityQuery = {}, signal?: AbortSignal) =>
    apiRequest<CursorPage<ActivityLog>>(projectId ? `/projects/${projectId}/activity` : '/activity', {
      query,
      signal,
    }),
};
