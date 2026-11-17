import { readdir, readFile } from 'node:fs/promises';
import { logger } from '../config/logger.js';
import { pool } from '../infra/db/pool.js';
import { withTransaction } from '../infra/db/transaction.js';

const MIGRATIONS_DIR = new URL('../../db/migrations/', import.meta.url);

async function migrate() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name       text        PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    );
    ALTER TABLE schema_migrations ENABLE ROW LEVEL SECURITY;
  `);

  const { rows } = await pool.query('SELECT name FROM schema_migrations');
  const applied = new Set(rows.map((row: { name: string }) => row.name));
  const files = (await readdir(MIGRATIONS_DIR)).filter((file) => file.endsWith('.sql')).sort();

  for (const file of files) {
    if (applied.has(file)) continue;
    const sql = await readFile(new URL(file, MIGRATIONS_DIR), 'utf8');
    await withTransaction(async (tx) => {
      await tx.query(sql);
      await tx.query('INSERT INTO schema_migrations (name) VALUES ($1)', [file]);
    });
    logger.info({ migration: file }, 'Migration aplicada');
  }

  logger.info('Banco de dados atualizado');
}

try {
  await migrate();
} catch (err) {
  logger.fatal({ err }, 'Falha ao aplicar migrations');
  process.exitCode = 1;
} finally {
  await pool.end();
}
