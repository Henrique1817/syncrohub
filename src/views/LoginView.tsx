import { useState, type FormEvent } from 'react';
import { AlertCircle, LogIn, Workflow } from 'lucide-react';
import { getErrorMessage } from '../api/client';
import { Button } from '../components/ui/Button';
import { Field, inputClass } from '../components/ui/Field';
import { useLogin } from '../queries/auth';

export function LoginView() {
  const login = useLogin();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    login.mutate({ email: email.trim(), password });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 text-white shadow-sm">
            <Workflow className="h-5 w-5" />
          </div>
          <h1 className="mt-4 text-xl font-semibold tracking-tight text-zinc-950">Entrar no SyncroHub</h1>
          <p className="mt-1 text-sm text-zinc-500">Acompanhe projetos, etapas e demandas.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-zinc-200 bg-white p-6 shadow-xs">
          {login.isError && (
            <div role="alert" className="flex items-start gap-2 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {getErrorMessage(login.error)}
            </div>
          )}
          <Field label="E-mail" htmlFor="login-email">
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              autoFocus
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@empresa.com"
              className={inputClass}
            />
          </Field>
          <Field label="Senha" htmlFor="login-password">
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
            />
          </Field>
          <Button type="submit" icon={LogIn} className="w-full" disabled={login.isPending}>
            {login.isPending ? 'Entrando…' : 'Entrar'}
          </Button>
        </form>

        <p className="mt-4 text-center text-xs text-zinc-400">
          Primeiro acesso? Use o link do convite que você recebeu por e-mail.
        </p>
      </div>
    </div>
  );
}
