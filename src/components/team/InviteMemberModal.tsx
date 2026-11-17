import { useState, type FormEvent } from 'react';
import { AlertCircle, Mail, Send, UserPlus, X } from 'lucide-react';
import { getErrorMessage } from '../../api/client';
import { DEPARTMENTS, DEPARTMENT_META } from '../../lib/constants';
import { cn } from '../../lib/utils';
import { useInviteMember } from '../../queries/team';
import type { Department, InvitationResult } from '../../types';
import { Button } from '../ui/Button';
import { Field, inputClass } from '../ui/Field';
import { Modal } from '../ui/Modal';
import { InviteResultPanel } from './InviteResultPanel';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function InviteForm({ onInvited, onClose }: { onInvited: (result: InvitationResult) => void; onClose: () => void }) {
  const invite = useInviteMember();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [positionTitle, setPositionTitle] = useState('');
  const [department, setDepartment] = useState<Department | null>(null);

  const canSubmit = name.trim().length >= 2 && EMAIL_PATTERN.test(email.trim()) && department && !invite.isPending;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !department) return;
    invite.mutate(
      { name: name.trim(), email: email.trim(), department, positionTitle: positionTitle.trim() || undefined },
      { onSuccess: onInvited },
    );
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex items-start justify-between gap-3 border-b border-zinc-100 px-5 py-4">
        <div className="flex items-start gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-900 text-white">
            <UserPlus className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-base font-semibold tracking-tight text-zinc-950">Convidar funcionário</h2>
            <p className="text-sm text-zinc-500">Ele recebe um e-mail do segmento escolhido para criar a senha e entrar.</p>
          </div>
        </div>
        <button type="button" onClick={onClose} className="rounded-md p-1 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700" aria-label="Fechar">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-5 px-5 py-5">
        {invite.isError && (
          <div role="alert" className="flex items-start gap-2 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {getErrorMessage(invite.error)}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nome completo" htmlFor="member-name">
            <input id="member-name" autoFocus maxLength={120} value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Ana Souza" className={inputClass} />
          </Field>
          <Field label="E-mail corporativo" htmlFor="member-email">
            <input
              id="member-email"
              type="email"
              autoComplete="off"
              maxLength={254}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ana@empresa.com"
              className={inputClass}
            />
          </Field>
        </div>

        <Field label="Segmento">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {DEPARTMENTS.map((value) => {
              const meta = DEPARTMENT_META[value];
              const Icon = meta.icon;
              const active = department === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setDepartment(value)}
                  aria-pressed={active}
                  className={cn(
                    'flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition',
                    active ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-500/20' : 'border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50',
                  )}
                >
                  <Icon className={cn('h-4 w-4', active ? 'text-indigo-600' : 'text-zinc-400')} />
                  <span className="text-sm font-medium text-zinc-900">{meta.label}</span>
                  <span className="text-[11px] leading-tight text-zinc-500">{meta.hint}</span>
                </button>
              );
            })}
          </div>
        </Field>

        <Field label="Cargo" hint="Opcional" htmlFor="member-title">
          <input
            id="member-title"
            maxLength={120}
            value={positionTitle}
            onChange={(e) => setPositionTitle(e.target.value)}
            placeholder="Ex.: Analista de Compras"
            className={inputClass}
          />
        </Field>

        <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-xs text-zinc-600">
          <p className="flex items-center gap-1.5 font-medium text-zinc-800">
            <Mail className="h-3.5 w-3.5" />
            O que o funcionário poderá fazer
          </p>
          <p className="mt-1">
            Acompanhar os projetos e etapas, enviar ideias e sugestões e comentar. Por enquanto, colaboradores não criam tasks
            nem demandas.
          </p>
          {department === 'MANAGEMENT' && (
            <p className="mt-1 font-medium text-zinc-800">Como é da Gerência, também poderá convidar e gerenciar a equipe.</p>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-2 rounded-b-xl border-t border-zinc-100 bg-zinc-50/80 px-5 py-3">
        <Button variant="ghost" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" icon={Send} disabled={!canSubmit}>
          {invite.isPending ? 'Enviando convite…' : 'Enviar convite'}
        </Button>
      </div>
    </form>
  );
}

export function InviteMemberModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [result, setResult] = useState<InvitationResult | null>(null);
  const close = () => {
    setResult(null);
    onClose();
  };

  return (
    <Modal open={open} onClose={close} size="lg">
      {result ? <InviteResultPanel result={result} onClose={close} /> : <InviteForm onInvited={setResult} onClose={close} />}
    </Modal>
  );
}
