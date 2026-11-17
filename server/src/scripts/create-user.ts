import { parseArgs } from 'node:util';
import { z } from 'zod';
import { pool } from '../infra/db/pool.js';
import { createUserSchema } from '../modules/users/users.schemas.js';
import { createUser } from '../modules/users/users.service.js';

// Uso: npm run user:create -- --name "Ana" --email ana@empresa.com --role ENGINEER --title "Software Engineer"
// A senha pode vir de --password ou da variável NEW_USER_PASSWORD (evita deixá-la no histórico do shell).
const { values } = parseArgs({
  options: {
    name: { type: 'string' },
    email: { type: 'string' },
    password: { type: 'string' },
    role: { type: 'string' },
    title: { type: 'string' },
  },
});

try {
  const input = createUserSchema.parse({
    name: values.name,
    email: values.email,
    password: values.password ?? process.env.NEW_USER_PASSWORD,
    role: values.role,
    positionTitle: values.title,
  });
  const user = await createUser(input);
  console.log(`Usuário criado: ${user.name} <${user.email}> [${user.role}] id=${user.id}`);
} catch (err) {
  console.error(err instanceof z.ZodError ? z.prettifyError(err) : err);
  process.exitCode = 1;
} finally {
  await pool.end();
}
