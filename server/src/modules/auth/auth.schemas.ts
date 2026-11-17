/* Arquivo de schemas de autenticação.
   loginSchema: Schema de login.
   LoginInput: Tipo de entrada de login.
*/

import { z } from 'zod';

/* Schema de login. */
export const loginSchema = z.object({
  email: z.email().max(254),
  password: z.string().min(1).max(72),
});

/* Tipo de entrada de login. */
export type LoginInput = z.infer<typeof loginSchema>;
