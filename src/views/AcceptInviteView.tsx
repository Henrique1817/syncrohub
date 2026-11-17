import { useState, type FormEvent } from 'react';
import { AlertCircle, KeyRound, Workflow } from 'lucide-react';
import { getErrorMessage } from '../api/client';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Field, inputClass } from '../components/ui/Field';
import { PageLoader } from '../components/ui/States';
import { DEPARTMENT_META } from '../lib/constants';
import { firstName, formatDate } from '../lib/utils';
import { useAcceptInvitation, useInvitation } from '../queries/team';
import { useUI } from '../store/ui';

const MIN_PASSWORD = 10;

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex justify-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 text-white shadow-sm">
            <Workflow className="h-5 w-5" />
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}

export function AcceptInviteView({ token }: { token: string }) {
  const navigate = useUI((s) => s.navigate);
  const toast = useUI((s) => s.toast);
  const invitation = useInvitation(token);
  const accept = useAcceptInvitation(token);
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');

  if (invitation.isPending) {
    return (
      <Shell>
        <PageLoader label="Validando convite…" />
      </Shell>
    );
  }

  if (invitation.isError) {
    return (
      <Shell>
        <div className="rounded-xl border border-zinc-200 bg-white p-6 text-center shadow-xs">
          <AlertCircle className="mx-auto h-6 w-6 text-rose-500" />
          <h1 className="mt-3 text-base font-semibold text-zinc-950">Convite indisponível</h1>
          <p className="mt-1 text-sm text-zinc-500">{getErrorMessage(invitation.error)}</p>
          <p className="mt-1 text-xs text-zinc-400">Peça ao responsável pelo portal para reenviar o convite.</p>
          <Button variant="secondary" className="mt-5 w-full" onClick={() => navigate({ name: 'dashboard' })}>
            Ir para o login
          </Button>
        </div>
      </Shell>
    );
  }

  const { name, email, department, expiresAt } = invitation.data;
  const segment = department ? DEPARTMENT_META[department] : null;
  const tooShort = password.length > 0 && password.length < MIN_PASSWORD;
  const mismatch = confirmation.length > 0 && confirmation !== password;
  const canSubmit = password.length >= MIN_PASSWORD && password === confirmation && !accept.isPending;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    accept.mutate(password, {
      onSuccess: () => {
        toast(`Bem-vindo(a), ${firstName(name)}!`, 'Seu acesso está ativo.');
        navigate({ name: 'dashboard' });
      },
    });
  };

  return (
    <Shell>
      <div className="mb-6 text-center">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-950">Olá, {firstName(name)}!</h1>
        <p className="mt-1 text-sm text-zinc-500">Crie sua senha para entrar no SyncroHub.</p>
        {segment && (
          <div className="mt-3 flex justify-center">
            <Badge tone={segment.tone} icon={segment.icon}>
              {segment.label}
            </Badge>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-zinc-200 bg-white p-6 shadow-xs">
        {accept.isError && (
          <div role="alert" className="flex items-start gap-2 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {getErrorMessage(accept.error)}
          </div>
        )}
        <Field label="E-mail">
          <input value={email} readOnly className={`${inputClass} bg-zinc-50 text-zinc-500`} />
        </Field>
        <Field label="Senha" hint={`Mínimo ${MIN_PASSWORD} caracteres`} htmlFor="invite-password">
          <input
            id="invite-password"
            type="password"
            autoComplete="new-password"
            autoFocus
            maxLength={72}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={tooShort}
            className={inputClass}
          />
        </Field>
        <Field label="Confirme a senha" htmlFor="invite-confirm">
          <input
            id="invite-confirm"
            type="password"
            autoComplete="new-password"
            maxLength={72}
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            aria-invalid={mismatch}
            className={inputClass}
          />
        </Field>
        {(tooShort || mismatch) && (
          <p className="text-xs text-rose-600">
            {tooShort ? `A senha precisa ter ao menos ${MIN_PASSWORD} caracteres.` : 'As senhas não conferem.'}
          </p>
        )}
        <Button type="submit" icon={KeyRound} className="w-full" disabled={!canSubmit}>
          {accept.isPending ? 'Ativando…' : 'Ativar meu acesso'}
        </Button>
        <p className="text-center text-[11px] text-zinc-400">Convite válido até {formatDate(expiresAt)}.</p>
      </form>
    </Shell>
  );
}
