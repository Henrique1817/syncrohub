import { useState, type FormEvent } from 'react';
import { AlertCircle, Pencil, X } from 'lucide-react';
import { getErrorMessage } from '../../api/client';
import { useUpdateMember } from '../../queries/team';
import { useUI } from '../../store/ui';
import type { TeamMember } from '../../types';
import { Button } from '../ui/Button';
import { Field, inputClass } from '../ui/Field';
import { Modal } from '../ui/Modal';

function EditMemberForm({ member, onClose }: { member: TeamMember; onClose: () => void }) {
  const toast = useUI((s) => s.toast);
  const update = useUpdateMember();
  const [name, setName] = useState(member.name);
  const [positionTitle, setPositionTitle] = useState(member.positionTitle ?? '');

  const trimmedName = name.trim();
  const trimmedTitle = positionTitle.trim();
  const changed = trimmedName !== member.name || trimmedTitle !== (member.positionTitle ?? '');
  const canSubmit = trimmedName.length >= 2 && changed && !update.isPending;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    update.mutate(
      { userId: member.id, input: { name: trimmedName, positionTitle: trimmedTitle || null } },
      {
        onSuccess: () => {
          toast('Perfil atualizado', trimmedName);
          onClose();
        },
      },
    );
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex items-start justify-between gap-3 border-b border-zinc-100 px-5 py-4">
        <div className="flex items-start gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-900 text-white">
            <Pencil className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-base font-semibold tracking-tight text-zinc-950">Editar funcionário</h2>
            <p className="text-sm text-zinc-500">{member.email}</p>
          </div>
        </div>
        <button type="button" onClick={onClose} className="rounded-md p-1 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700" aria-label="Fechar">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-4 px-5 py-5">
        {update.isError && (
          <div role="alert" className="flex items-start gap-2 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {getErrorMessage(update.error)}
          </div>
        )}
        <Field label="Nome completo" htmlFor="edit-member-name">
          <input id="edit-member-name" autoFocus maxLength={120} value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
        </Field>
        <Field label="Cargo" hint="Opcional" htmlFor="edit-member-title">
          <input
            id="edit-member-title"
            maxLength={120}
            value={positionTitle}
            onChange={(e) => setPositionTitle(e.target.value)}
            placeholder="Ex.: Analista de Compras"
            className={inputClass}
          />
        </Field>
        <p className="text-[11px] text-zinc-400">O novo nome aparece em todo o portal: projetos, tasks, ideias e atividades.</p>
      </div>

      <div className="flex justify-end gap-2 rounded-b-xl border-t border-zinc-100 bg-zinc-50/80 px-5 py-3">
        <Button variant="ghost" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" disabled={!canSubmit}>
          {update.isPending ? 'Salvando…' : 'Salvar'}
        </Button>
      </div>
    </form>
  );
}

export function EditMemberModal({ member, onClose }: { member: TeamMember | null; onClose: () => void }) {
  return (
    <Modal open={Boolean(member)} onClose={onClose}>
      {member && <EditMemberForm key={member.id} member={member} onClose={onClose} />}
    </Modal>
  );
}
