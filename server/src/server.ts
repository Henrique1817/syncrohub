import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { pool } from './infra/db/pool.js';

const SHUTDOWN_TIMEOUT_MS = 10_000;

const server = createApp().listen(env.PORT, (error) => {
  if (error) {
    logger.fatal({ err: error }, 'Falha ao iniciar o servidor HTTP');
    process.exit(1);
  }
  logger.info(`SyncroHub API ouvindo na porta ${env.PORT} (${env.NODE_ENV})`);
});

function shutdown(signal: NodeJS.Signals) {
  logger.info({ signal }, 'Encerrando servidor');
  setTimeout(() => process.exit(1), SHUTDOWN_TIMEOUT_MS).unref();

  server.close((closeError) => {
    pool
      .end()
      .catch((err: unknown) => logger.error({ err }, 'Erro ao encerrar pool do banco'))
      .finally(() => process.exit(closeError ? 1 : 0));
  });
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
process.on('unhandledRejection', (reason) => {
  logger.fatal({ err: reason }, 'Promise rejeitada sem tratamento');
  process.exit(1);
});
