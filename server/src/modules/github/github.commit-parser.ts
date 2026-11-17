import type { TaskStatus } from '../../shared/domain/enums.js';

export interface CommitTaskDirective {
  taskPrefix: string;
  targetStatus: TaskStatus;
}

const KEYWORD_TO_STATUS: Record<string, TaskStatus> = {
  done: 'DONE',
  close: 'DONE',
  closes: 'DONE',
  closed: 'DONE',
  fix: 'DONE',
  fixes: 'DONE',
  fixed: 'DONE',
  resolve: 'DONE',
  resolves: 'DONE',
  resolved: 'DONE',
  conclui: 'DONE',
  concluido: 'DONE',
  finaliza: 'DONE',
  wip: 'IN_PROGRESS',
  start: 'IN_PROGRESS',
  starts: 'IN_PROGRESS',
  started: 'IN_PROGRESS',
  doing: 'IN_PROGRESS',
  progress: 'IN_PROGRESS',
  progresso: 'IN_PROGRESS',
  inicia: 'IN_PROGRESS',
  iniciando: 'IN_PROGRESS',
  todo: 'TODO',
  reopen: 'TODO',
  reabre: 'TODO',
  backlog: 'BACKLOG',
};

const KEYWORDS_PATTERN = Object.keys(KEYWORD_TO_STATUS).join('|');
const DIRECTIVE_REGEX = new RegExp(`\\b(${KEYWORDS_PATTERN})\\s+#([0-9a-f-]{6,36})\\b`, 'gi');

/**
 * Extrai diretivas como `[wip #a1b2c3d4]`, `done #a1b2c3d4` ou `closes #a1b2c3d4`
 * de uma mensagem de commit.
 */
export function parseCommitDirectives(message: string): CommitTaskDirective[] {
  const directives: CommitTaskDirective[] = [];
  const seen = new Set<string>();

  for (const match of message.matchAll(DIRECTIVE_REGEX)) {
    const keyword = match[1]?.toLowerCase();
    const prefix = match[2]?.toLowerCase();
    if (!keyword || !prefix) continue;

    const targetStatus = KEYWORD_TO_STATUS[keyword];
    if (!targetStatus) continue;

    const key = `${prefix}:${targetStatus}`;
    if (seen.has(key)) continue;
    seen.add(key);

    directives.push({ taskPrefix: prefix, targetStatus });
  }

  return directives;
}
