/* Arquivo de funções auxiliares para transações com o banco de dados.
   withTransaction: Executa uma função dentro de uma transação.
*/

import type { PoolClient } from 'pg';
import { pool } from './pool.js';

export async function withTransaction<T>(work: (tx: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await work(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK').catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}
