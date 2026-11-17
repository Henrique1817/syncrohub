import { createHmac, timingSafeEqual } from 'node:crypto';
import { env } from '../../config/env.js';
import { pool } from '../../infra/db/pool.js';
import { withTransaction } from '../../infra/db/transaction.js';
import type { AuthUser } from '../../shared/domain/auth.js';
import type { TaskStatus } from '../../shared/domain/enums.js';
import { TASK_STATUS_LABEL } from '../../shared/domain/labels.js';
import { badRequest, notFound, unauthorized } from '../../shared/errors/app-error.js';
import { recordActivity } from '../activity/activity.service.js';
import * as projectsRepository from '../projects/projects.repository.js';
import { assertNotArchived } from '../projects/projects.service.js';
import * as tasksRepository from '../tasks/tasks.repository.js';
import { fetchRecentCommits, fetchRepoMetadata, type GitHubCommit } from './github.client.js';
import { parseCommitDirectives } from './github.commit-parser.js';

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

export function previewGitHubRepo(repoInput: string, token?: string) {
  return fetchRepoMetadata(repoInput, token);
}

async function applyCommitsToProject(
  projectId: string,
  githubRepo: string,
  commits: GitHubCommit[],
  actorUserId: string | null,
): Promise<GitHubSyncResult> {
  const updatedTasks: GitHubSyncTaskUpdate[] = [];

  await withTransaction(async (tx) => {
    const project = await projectsRepository.lockById(tx, projectId);
    if (!project) throw notFound('Projeto não encontrado.');
    assertNotArchived(project);

    const tasks = await tasksRepository.listByProject(tx, projectId, {});

    for (const commit of commits) {
      const directives = parseCommitDirectives(commit.message);
      if (!directives.length) continue;

      const shortSha = commit.sha.slice(0, 7);
      const firstLine = commit.message.split('\n')[0]?.trim() || commit.message.trim();

      for (const directive of directives) {
        const matches = tasks.filter((t) => t.id.toLowerCase().startsWith(directive.taskPrefix));
        if (matches.length !== 1) continue;

        const task = matches[0]!;
        if (task.status === directive.targetStatus) continue;

        const previousStatus = task.status;
        await tasksRepository.updateStatus(tx, task.id, directive.targetStatus);
        task.status = directive.targetStatus;

        await recordActivity(tx, {
          projectId,
          userId: actorUserId,
          actionType: 'GITHUB_COMMIT_APPLIED',
          description: `Commit ${shortSha} moveu "${task.title}": ${TASK_STATUS_LABEL[previousStatus]} → ${TASK_STATUS_LABEL[directive.targetStatus]}`,
          metadata: {
            taskId: task.id,
            from: previousStatus,
            to: directive.targetStatus,
            commitSha: commit.sha,
            commitMessage: firstLine,
            commitAuthor: commit.authorName,
            commitUrl: commit.url,
          },
        });

        updatedTasks.push({
          taskId: task.id,
          taskTitle: task.title,
          from: previousStatus,
          to: directive.targetStatus,
          commitSha: shortSha,
          commitMessage: firstLine,
        });
      }
    }

    await projectsRepository.touchGitHubSyncedAt(tx, projectId);
  });

  return {
    projectId,
    githubRepo,
    processedCommits: commits.length,
    updatedTasks,
  };
}

export async function syncProjectFromGitHub(
  user: AuthUser,
  projectId: string,
  token?: string,
): Promise<GitHubSyncResult> {
  const project = await projectsRepository.findById(pool, projectId);
  if (!project) throw notFound('Projeto não encontrado.');
  assertNotArchived(project);

  if (!project.githubRepo) {
    throw badRequest('Este projeto não está vinculado a um repositório GitHub.');
  }

  const projectToken = await projectsRepository.findGitHubTokenById(pool, projectId);
  const commits = await fetchRecentCommits(
    project.githubRepo,
    project.githubDefaultBranch,
    token ?? projectToken ?? undefined,
  );
  // Processa do mais antigo para o mais recente para respeitar a ordem cronológica dos commits.
  return applyCommitsToProject(project.id, project.githubRepo, [...commits].reverse(), user.id);
}

function verifyWebhookSignature(rawBody: Buffer | undefined, signatureHeader: string | undefined): void {
  const secret = env.GITHUB_WEBHOOK_SECRET;
  if (!secret) return;

  if (!signatureHeader || !rawBody) {
    throw unauthorized('Assinatura do webhook GitHub ausente.');
  }

  const expected = `sha256=${createHmac('sha256', secret).update(rawBody).digest('hex')}`;
  const expectedBuf = Buffer.from(expected, 'utf8');
  const receivedBuf = Buffer.from(signatureHeader, 'utf8');

  if (expectedBuf.length !== receivedBuf.length || !timingSafeEqual(expectedBuf, receivedBuf)) {
    throw unauthorized('Assinatura do webhook GitHub inválida.');
  }
}

interface GitHubPushPayload {
  repository?: { full_name?: string };
  commits?: Array<{
    id?: string;
    message?: string;
    url?: string;
    author?: { name?: string };
  }>;
}

export async function handleGitHubWebhook(
  rawBody: Buffer | undefined,
  signatureHeader: string | undefined,
  eventHeader: string | undefined,
  payload: unknown,
) {
  verifyWebhookSignature(rawBody, signatureHeader);

  if (eventHeader === 'ping') {
    return { ok: true, event: 'ping' };
  }
  if (eventHeader !== 'push') {
    return { ok: true, ignored: true, event: eventHeader ?? null };
  }

  const push = payload as GitHubPushPayload;
  const fullName = push.repository?.full_name;
  if (!fullName) {
    throw badRequest('Payload de push sem repository.full_name.');
  }

  const commits: GitHubCommit[] = (push.commits ?? [])
    .filter((c): c is { id: string; message: string; url?: string; author?: { name?: string } } =>
      Boolean(c.id && c.message),
    )
    .map((c) => ({
      sha: c.id,
      message: c.message,
      authorName: c.author?.name ?? null,
      url: c.url ?? null,
    }));

  const projects = await projectsRepository.findActiveByGitHubRepo(pool, fullName);
  const results: GitHubSyncResult[] = [];

  for (const project of projects) {
    results.push(await applyCommitsToProject(project.id, fullName, commits, null));
  }

  return { ok: true, repository: fullName, projectsMatched: projects.length, results };
}

