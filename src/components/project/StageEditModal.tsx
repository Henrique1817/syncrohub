import { useState, type FormEvent } from 'react';
import { AlertCircle, AlertTriangle, Pencil, Save, Trash2, X } from 'lucide-react';
import { getErrorMessage } from '../../api/client';
import { pluralize } from '../../lib/utils';
import { useDeleteStage, useUpdateStage } from '../../queries/stages';
import { useUI } from '../../store/ui';
import type { StageWithStats } from '../../types';
import { Button } from '../ui/Button';
import { Field, inputClass } from '../ui/Field';
import { Modal } from '../ui/Modal';

function StageEditForm({ stage, onClose }: { stage: StageWithStats; onClose: () => void }) {
  const toast = useUI((s) => s.toast);
  const update = useUpdateStage();
  const remove = useDeleteStage();

  const [title, setTitle] = useState(stage.title);
  const [description, setDescription] = useState(stage.description ?? '');
  const [dueDate, setDueDate] = useState(stage.dueDate ?? '');
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const patch = {
    ...(title.trim() !== stage.title && { title: title.trim() }),
    ...(description.trim() !== (stage.description ?? '') && { description: description.trim() || null }),
    ...(dueDate !== (stage.dueDate ?? '') && { dueDate: dueDate || null }),
  };
  const hasChanges = Object.keys(patch).length > 0;
  const busy = update.isPending || remove.isPending;
  const error = update.error ?? remove.error;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (title.trim().length < 2 || !hasChanges || busy) return;
    update.mutate(
      { stageId: stage.id, input: patch },
      {
        onSuccess: () => {
          toast('Etapa atualizada', title.trim());
          onClose();
        },
      },
    );
  };

  const handleDelete = () =>
    remove.mutate(stage.id, {
      onSuccess: () => {
        toast('Etapa removida', stage.title);
        onClose();
      },
    });

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
        <h2 className="flex items-center gap-2 text-base font-semibold tracking-tight text-zinc-950">
          <Pencil className="h-4 w-4 text-zinc-400" />
          Editar etapa
        </h2>
        <button type="button" onClick={onClose} className="rounded-md p-1 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700" aria-label="Fechar">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-4 px-5 py-5">
        {error && (
          <div role="alert" className="flex items-start gap-2 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {getErrorMessage(error)}
          </div>
        )}

        <Field label="Nome" htmlFor="stage-title">
          <input id="stage-title" autoFocus maxLength={160} value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
        </Field>
        <Field label="Descrição" hint="Opcional" htmlFor="stage-description">
          <textarea
            id="stage-description"
            rows={2}
            maxLength={2000}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Prazo" hint="Opcional · etapas vencidas aparecem como atrasadas" htmlFor="stage-due">
          <div className="flex gap-2">
            <input id="stage-due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={inputClass} />
            {dueDate && (
              <Button variant="ghost" size="md" onClick={() => setDueDate('')}>
                Limpar
              </Button>
            )}
          </div>
        </Field>

        <div className="rounded-lg border border-rose-200 bg-rose-50/40 p-3">
          {confirmingDelete ? (
            <div className="space-y-3">
              <p className="flex items-start gap-2 text-xs text-rose-800">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {stage.totalTasks
                  ? `${pluralize(stage.totalTasks, 'task desta etapa ficará', 'tasks desta etapa ficarão')} sem etapa (não são apagadas).`
                  : 'Esta etapa não tem tasks.'}
              </p>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setConfirmingDelete(false)}>
                  Manter
                </Button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={busy}
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-rose-600 px-2.5 text-xs font-medium text-white shadow-sm transition hover:bg-rose-500 disabled:bg-rose-300"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Remover etapa
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-rose-800">Remover esta etapa do roadmap</p>
              <Button variant="danger" size="sm" icon={Trash2} onClick={() => setConfirmingDelete(true)}>
                Remover
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-2 rounded-b-xl border-t border-zinc-100 bg-zinc-50/80 px-5 py-3">
        <Button variant="ghost" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" icon={Save} disabled={title.trim().length < 2 || !hasChanges || busy}>
          {update.isPending ? 'Salvando…' : 'Salvar'}
        </Button>
      </div>
    </form>
  );
}

export function StageEditModal({ stage, onClose }: { stage: StageWithStats | null; onClose: () => void }) {
  return (
    <Modal open={Boolean(stage)} onClose={onClose}>
      {stage && <StageEditForm key={stage.id} stage={stage} onClose={onClose} />}
    </Modal>
  );
}
