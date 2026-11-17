import { pool } from '../../infra/db/pool.js';
import { withTransaction } from '../../infra/db/transaction.js';
import type { AuthUser } from '../../shared/domain/auth.js';
import { PROJECT_STATUS_LABEL } from '../../shared/domain/labels.js';
import { conflict, notFound } from '../../shared/errors/app-error.js';
import { recordActivity } from '../activity/activity.service.js';
import * as stagesRepository from '../stages/stages.repository.js';
import * as projectsRepository from './projects.repository.js';
import type { CreateProjectInput, ListProjectsQuery, UpdateProjectInput } from './projects.schemas.js';
import type { Project, ProjectDetail } from './projects.types.js';

export function listProjects(query: ListProjectsQuery) {
  return projectsRepository.listOverview(pool, query);
}

export async function getProject(projectId: string): Promise<ProjectDetail> {
  const [overview, stages] = await Promise.all([
    projectsRepository.findOverviewById(pool, projectId),
    stagesRepository.listByProject(pool, projectId),
  ]);
  if (!overview) throw notFound('Projeto não encontrado.');
  return { ...overview, stages };
}

/** Projetos arquivados ficam visíveis, mas não recebem novas demandas, tasks ou ideias. */
export function assertNotArchived(project: Pick<Project, 'archivedAt'>) {
  if (project.archivedAt) throw conflict('Este projeto está arquivado. Restaure-o para registrar novos itens.');
}

export async function createProject(user: AuthUser, input: CreateProjectInput) {
  const projectId = await withTransaction(async (tx) => {
    const project = await projectsRepository.insert(tx, {
      name: input.name,
      description: input.description ?? null,
      status: input.status,
      dueDate: input.dueDate ?? null,
      createdBy: user.id,
    });
    const stages = await stagesRepository.insertMany(tx, project.id, input.stages);

    await recordActivity(tx, {
      projectId: project.id,
      userId: user.id,
      actionType: 'PROJECT_CREATED',
      description: `Projeto "${project.name}" criado com ${input.stages.length} etapa(s)`,
      metadata: { status: project.status, stageCount: input.stages.length, dueDate: project.dueDate },
    });

    const firstStage = stages[0];
    if (input.startFirstStage && firstStage) {
      await stagesRepository.updateStatus(tx, firstStage.id, 'ACTIVE');
      await recordActivity(tx, {
        projectId: project.id,
        userId: user.id,
        actionType: 'STAGE_ADVANCED',
        description: `Etapa "${firstStage.title}" iniciada junto com o projeto`,
        metadata: { stageId: firstStage.id, from: 'PENDING', to: 'ACTIVE', automatic: true },
      });
    }
    return project.id;
  });

  return getProject(projectId);
}

export async function updateProject(user: AuthUser, projectId: string, patch: UpdateProjectInput) {
  await withTransaction(async (tx) => {
    const current = await projectsRepository.lockById(tx, projectId);
    if (!current) throw notFound('Projeto não encontrado.');

    const project = (await projectsRepository.update(tx, projectId, patch))!;
    const statusChanged = patch.status !== undefined && patch.status !== current.status;

    await recordActivity(tx, {
      projectId,
      userId: user.id,
      actionType: statusChanged ? 'PROJECT_STATUS_CHANGED' : 'PROJECT_UPDATED',
      description: statusChanged
        ? `Projeto "${project.name}": ${PROJECT_STATUS_LABEL[current.status]} → ${PROJECT_STATUS_LABEL[project.status]}`
        : `Projeto "${project.name}" atualizado`,
      metadata: {
        ...(statusChanged ? { from: current.status, to: project.status } : { changes: Object.keys(patch) }),
        ...(patch.dueDate !== undefined && { previousDueDate: current.dueDate, dueDate: project.dueDate }),
      },
    });
  });

  return getProject(projectId);
}

/** Arquivar é reversível e preserva etapas, tasks e histórico; prefira-o à exclusão. */
export async function setProjectArchived(user: AuthUser, projectId: string, archived: boolean) {
  await withTransaction(async (tx) => {
    const current = await projectsRepository.lockById(tx, projectId);
    if (!current) throw notFound('Projeto não encontrado.');
    if (Boolean(current.archivedAt) === archived) return;

    const project = await projectsRepository.setArchived(tx, projectId, archived);
    await recordActivity(tx, {
      projectId,
      userId: user.id,
      actionType: archived ? 'PROJECT_ARCHIVED' : 'PROJECT_RESTORED',
      description: archived ? `Projeto "${project.name}" arquivado` : `Projeto "${project.name}" restaurado`,
    });
  });

  return getProject(projectId);
}

export function deleteProject(user: AuthUser, projectId: string) {
  return withTransaction(async (tx) => {
    const project = await projectsRepository.lockById(tx, projectId);
    if (!project) throw notFound('Projeto não encontrado.');

    await projectsRepository.remove(tx, projectId);
    // project_id nulo: o log do projeto é removido em cascata, este registro preserva a exclusão na timeline geral.
    await recordActivity(tx, {
      projectId: null,
      userId: user.id,
      actionType: 'PROJECT_DELETED',
      description: `Projeto "${project.name}" excluído`,
      metadata: { projectId, name: project.name },
    });
  });
}
