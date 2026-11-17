/* Arquivo de funções auxiliares para consultas SQL.
   queryOne: Executa uma consulta e retorna o primeiro resultado.
   queryMany: Executa uma consulta e retorna todos os resultados.
   buildSetClause: Monta a cláusula SET para uma consulta SQL.
*/

import type { Queryable } from './pool.js';

export async function queryOne<R>(db: Queryable, text: string, values: unknown[] = []): Promise<R | null> {
  const { rows } = await db.query(text, values);
  return (rows[0] as R | undefined) ?? null;
}

export async function queryMany<R>(db: Queryable, text: string, values: unknown[] = []): Promise<R[]> {
  const { rows } = await db.query(text, values);
  return rows as R[];
}

/**
 * Monta `coluna = $n` apenas para as chaves presentes no patch (`undefined` é ignorado,
 * `null` limpa a coluna). Os nomes de coluna vêm sempre do mapa fixo, nunca do cliente.
 */
export function buildSetClause(
  patch: Record<string, unknown>,
  columns: Record<string, string>,
  firstParamIndex: number,
): { assignments: string[]; values: unknown[] } {
  const assignments: string[] = [];
  const values: unknown[] = [];

  for (const [key, column] of Object.entries(columns)) {
    const value = patch[key];
    if (value === undefined) continue;
    values.push(value);
    assignments.push(`${column} = $${firstParamIndex + values.length - 1}`);
  }

  return { assignments, values };
}
