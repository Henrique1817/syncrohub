# SyncroHub

Aplicação full-stack (React + Vite no frontend e Express + TypeScript + PostgreSQL no backend).

## Executando com Docker

Suba todos os serviços (PostgreSQL, API e Frontend com Nginx):

```bash
docker compose up -d --build
```

Na primeira execução, aplique as migrations no banco de dados:

```bash
docker compose exec api node dist/scripts/migrate.js
```

Acesse a aplicação em `http://localhost:8080` (ou na porta definida em `APP_PORT`).

### Variáveis de ambiente

Para produção, crie um arquivo `.env` na raiz (não versionado) sobrescrevendo ao menos `JWT_SECRET`, `POSTGRES_PASSWORD`, `CORS_ORIGINS` e `APP_URL`. Caso utilize um PostgreSQL externo (ex.: Supabase), defina `DATABASE_URL` e `DATABASE_SSL=no-verify`.

