/* Arquivo de configuração do pool de conexões com o banco de dados PostgreSQL.
  Pool é uma instância do PostgreSQL que gerencia as conexões com o banco de dados.
*/

import { readFileSync } from 'node:fs';
import pg from 'pg';
import type { PoolConfig, QueryResult } from 'pg';
import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';

const PG_DATE_OID = 1082;

// Colunas `date` ficam como 'YYYY-MM-DD'; o parser padrão cria um Date no fuso local do servidor.
pg.types.setTypeParser(PG_DATE_OID, (value: string) => value);

/** Contrato mínimo aceito pelos repositórios: tanto o pool quanto um client em transação. */
export interface Queryable {
  query(text: string, values?: unknown[]): Promise<QueryResult>;
}

function resolveSsl(): PoolConfig['ssl'] {
  switch (env.DATABASE_SSL) {
    case 'disable':
      return false;
    case 'no-verify':
      return { rejectUnauthorized: false };
    case 'verify-full':
      return {
        rejectUnauthorized: true,
        ...(env.DATABASE_CA_CERT_PATH ? { ca: readFileSync(env.DATABASE_CA_CERT_PATH, 'utf8') } : {}),
      };
  }
}

export const pool = new pg.Pool({
  connectionString: env.DATABASE_URL,
  ssl: resolveSsl(),
  max: env.DATABASE_POOL_MAX,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
  application_name: 'syncrohub-api',
});

pool.on('error', (err) => {
  logger.error({ err }, 'Erro inesperado em conexão ociosa do pool');
});
