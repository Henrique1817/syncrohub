import { z } from 'zod';

try {
  process.loadEnvFile();
} catch {
  // Sem .env local: as variáveis vêm do ambiente (produção/CI).
}

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3333),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  TRUST_PROXY: z.coerce.number().int().min(0).default(0),
  CORS_ORIGINS: z
    .string()
    .default('http://localhost:5173')
    .transform((value) =>
      value
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean),
    ),

  DATABASE_URL: z.string().min(1),
  DATABASE_SSL: z.enum(['disable', 'no-verify', 'verify-full']).default('no-verify'),
  DATABASE_CA_CERT_PATH: z.string().optional(),
  DATABASE_POOL_MAX: z.coerce.number().int().positive().default(10),

  JWT_SECRET: z.string().min(32, 'JWT_SECRET precisa ter ao menos 32 caracteres.'),
  JWT_TTL_SECONDS: z.coerce.number().int().positive().default(8 * 60 * 60),

  /** Endereço do frontend, usado para montar o link do convite. */
  APP_URL: z.url().default('http://localhost:5173'),
  /** Sem chave, os convites não são enviados: o link fica disponível na tela de Equipe. */
  RESEND_API_KEY: z
    .string()
    .optional()
    .transform((value) => value?.trim() || undefined),
  EMAIL_FROM: z.string().min(3).default('SyncroHub <onboarding@resend.dev>'),
  INVITE_TTL_HOURS: z.coerce.number().int().positive().default(7 * 24),

  /** Token opcional (PAT) para importar repositórios privados e aumentar rate limit do GitHub. */
  GITHUB_TOKEN: z
    .string()
    .optional()
    .transform((value) => value?.trim() || undefined),
  /** Secret opcional configurado no webhook do repositório GitHub para validar X-Hub-Signature-256. */
  GITHUB_WEBHOOK_SECRET: z
    .string()
    .optional()
    .transform((value) => value?.trim() || undefined),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error(`Variáveis de ambiente inválidas:\n${z.prettifyError(parsed.error)}`);
  process.exit(1);
}

export const env = parsed.data;
export const isProduction = env.NODE_ENV === 'production';
