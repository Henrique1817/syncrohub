import { env } from '../../config/env.js';
import { AppError, badRequest } from '../../shared/errors/app-error.js';

const GITHUB_API_BASE = 'https://api.github.com';
const MAX_README_LENGTH = 5000;

export interface ParsedGitHubRepo {
  owner: string;
  repo: string;
  fullName: string;
}

export interface GitHubRepoMetadata {
  name: string;
  githubRepo: string;
  githubUrl: string;
  defaultBranch: string;
  description: string | null;
}

export interface GitHubCommit {
  sha: string;
  message: string;
  authorName: string | null;
  url: string | null;
}

/**
 * Aceita `owner/repo`, `https://github.com/owner/repo` ou `https://github.com/owner/repo.git`.
 */
export function parseGitHubRepo(rawInput: string): ParsedGitHubRepo {
  const trimmed = rawInput.trim().replace(/\.git$/i, '').replace(/\/+$/, '');
  const match =
    /^(?:https?:\/\/(?:www\.)?github\.com\/)?([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)(?:\/.*)?$/i.exec(trimmed);

  if (!match?.[1] || !match[2]) {
    throw badRequest('Informe o repositório no formato "usuario/repositorio" ou URL do GitHub.');
  }

  const owner = match[1];
  const repo = match[2];
  return { owner, repo, fullName: `${owner}/${repo}` };
}

function buildHeaders(token?: string, accept = 'application/vnd.github+json'): Record<string, string> {
  const resolvedToken = token?.trim() || env.GITHUB_TOKEN;
  const headers: Record<string, string> = {
    Accept: accept,
    'User-Agent': 'SyncroHub-API',
    'X-GitHub-Api-Version': '2022-11-28',
  };
  if (resolvedToken) {
    headers.Authorization = `Bearer ${resolvedToken}`;
  }
  return headers;
}

async function githubFetch(path: string, token?: string, accept?: string): Promise<Response> {
  const response = await fetch(`${GITHUB_API_BASE}${path}`, {
    headers: buildHeaders(token, accept),
  });

  if (response.status === 404) {
    throw new AppError(404, 'GITHUB_NOT_FOUND', 'Repositório não encontrado no GitHub (ou privado sem token).');
  }
  if (response.status === 401 || response.status === 403) {
    throw new AppError(
      502,
      'GITHUB_AUTH_ERROR',
      'Sem permissão ou limite de requisições do GitHub atingido. Configure GITHUB_TOKEN.',
    );
  }
  if (!response.ok) {
    throw new AppError(502, 'GITHUB_UPSTREAM_ERROR', `Falha ao consultar GitHub (${response.status}).`);
  }

  return response;
}

function cleanReadmeText(raw: string): string {
  const normalized = raw.replace(/\r\n/g, '\n').trim();
  if (normalized.length <= MAX_README_LENGTH) return normalized;
  return `${normalized.slice(0, MAX_README_LENGTH - 3).trimEnd()}...`;
}

export async function fetchRepoMetadata(repoInput: string, token?: string): Promise<GitHubRepoMetadata> {
  const { owner, repo, fullName } = parseGitHubRepo(repoInput);

  const repoRes = await githubFetch(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`, token);
  const repoJson = (await repoRes.json()) as {
    name: string;
    full_name: string;
    html_url: string;
    default_branch: string;
    description: string | null;
  };

  let readmeText: string | null = null;
  try {
    const readmeRes = await fetch(
      `${GITHUB_API_BASE}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/readme`,
      { headers: buildHeaders(token, 'application/vnd.github.raw+json') },
    );
    if (readmeRes.ok) {
      const text = await readmeRes.text();
      if (text.trim()) readmeText = cleanReadmeText(text);
    }
  } catch {
    // Se não houver README ou falhar, usa a descrição curta do repositório.
  }

  return {
    name: repoJson.name || fullName,
    githubRepo: repoJson.full_name || fullName,
    githubUrl: repoJson.html_url || `https://github.com/${fullName}`,
    defaultBranch: repoJson.default_branch || 'main',
    description: readmeText ?? repoJson.description ?? null,
  };
}

export async function fetchRecentCommits(
  fullName: string,
  branch?: string | null,
  token?: string,
): Promise<GitHubCommit[]> {
  const { owner, repo } = parseGitHubRepo(fullName);
  const query = new URLSearchParams({ per_page: '20' });
  if (branch) query.set('sha', branch);

  const res = await githubFetch(
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/commits?${query.toString()}`,
    token,
  );
  const items = (await res.json()) as Array<{
    sha: string;
    html_url?: string;
    commit?: { message?: string; author?: { name?: string } };
  }>;

  return items.map((item) => ({
    sha: item.sha,
    message: item.commit?.message ?? '',
    authorName: item.commit?.author?.name ?? null,
    url: item.html_url ?? null,
  }));
}
