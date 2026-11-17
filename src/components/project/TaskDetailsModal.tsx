import { useState, type FormEvent, type ReactNode } from 'react';
import { AlertCircle, Save, X } from 'lucide-react';
import { getErrorMessage } from '../../api/client';
import { PRIORITY_META } from '../../lib/constants';
import { relativeTime } from '../../lib/utils';
import { useUpdateTask } from '../../queries/tasks';
import { useUI } from '../../store/ui';
import type { Task, TaskPriority } from '../../types';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { DateRangeFields, isValidDateRange } from '../ui/DateRangeFields';
import { Field, inputClass } from '../ui/Field';
import { Modal } from '../ui/Modal';
import { PriorityPicker } from '../ui/PriorityPicker';
import { useCanEditProject } from './ProjectAccess';
import { SourceBadge } from './SourceBadge';
import { TaskDates } from './TaskDates';
import { TaskStatusPill } from './TaskStatusSelect';

function Info({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-[11px] text-zinc-400">{label}</dt>
      <dd className="mt-0.5 flex items-center gap-1.5 text-xs font-medium text-zinc-800">{children}</dd>
    </div>
  );
}

function TaskMeta({ task }: { task: Task }) {
  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-3 rounded-lg bg-zinc-50 p-3 sm:grid-cols-3">
      <Info label="Etapa">{task.stageTitle ?? (task.status === 'BACKLOG' ? 'Em triagem' : 'Sem etapa')}</Info>
      <Info label={task.source === 'ENGINEER' ? 'Criada por' : 'Solicitada por'}>
        <Avatar name={task.createdByName} seed={task.createdBy} size="xs" />
        {task.createdByName}
      </Info>
      <Info label="Responsável">
        {task.assignedToName ? (
          <>
            <Avatar name={task.assignedToName} seed={task.assignedTo} size="xs" />
            {task.assignedToName}
          </>
        ) : (
          <span className="font-normal text-zinc-400">Não definido</span>
        )}
      </Info>
      <Info label="Criada">{relativeTime(task.createdAt)}</Info>
      {task.completedAt && <Info label="Entregue">{relativeTime(task.completedAt)}</Info>}
    </dl>
  );
}

function ReadOnlyDetails({ task }: { task: Task }) {
  return (
    <div className="space-y-4 px-5 py-5">
      <div>
        <h2 className="text-base font-semibold tracking-tight text-zinc-950">{task.title}</h2>
        {task.description && <p className="mt-1 text-sm leading-relaxed whitespace-pre-line text-zinc-600">{task.description}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Badge tone={PRIORITY_META[task.priority].tone}>Prioridade {PRIORITY_META[task.priority].label.toLowerCase()}</Badge>
        <TaskDates task={task} className="text-xs" />
        {!task.startDate && !task.dueDate && <span className="text-xs text-zinc-400">Sem datas definidas</span>}
      </div>
      <TaskMeta task={task} />
    </div>
  );
}

function EditableDetails({ task, onClose }: { task: Task; onClose: () => void }) {
  const toast = useUI((s) => s.toast);
  const update = useUpdateTask();

  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? '');
  const [priority, setPriority] = useState<TaskPriority>(task.priority);
  const [startDate, setStartDate] = useState(task.startDate ?? '');
  const [dueDate, setDueDate] = useState(task.dueDate ?? '');

  // PATCH exige ao menos um campo: enviamos só o que mudou.
  const patch = {
    ...(title.trim() !== task.title && { title: title.trim() }),
    ...(description.trim() !== (task.description ?? '') && { description: description.trim() || null }),
    ...(priority !== task.priority && { priority }),
    ...(startDate !== (task.startDate ?? '') && { startDate: startDate || null }),
    ...(dueDate !== (task.dueDate ?? '') && { dueDate: dueDate || null }),
  };
  const hasChanges = Object.keys(patch).length > 0;
  const canSubmit = title.trim().length >= 3 && isValidDateRange(startDate, dueDate) && hasChanges && !update.isPending;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    update.mutate(
      { taskId: task.id, input: patch },
      {
        onSuccess: () => {
          toast('Task atualizada');
          onClose();
        },
      },
    );
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-4 px-5 py-5">
        {update.isError && (
          <div role="alert" className="flex items-start gap-2 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {getErrorMessage(update.error)}
          </div>
        )}

        <Field label="Título" htmlFor="task-title">
          <input id="task-title" maxLength={200} value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
        </Field>
        <Field label="Descrição" hint="Opcional" htmlFor="task-description">
          <textarea
            id="task-description"
            rows={3}
            maxLength={5000}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Prioridade">
          <PriorityPicker value={priority} onChange={setPriority} />
        </Field>
        <DateRangeFields
          idPrefix="task"
          startDate={startDate}
          dueDate={dueDate}
          onStartChange={setStartDate}
          onDueChange={setDueDate}
        />
        <TaskMeta task={task} />
      </div>

      <div className="flex justify-end gap-2 rounded-b-xl border-t border-zinc-100 bg-zinc-50/80 px-5 py-3">
        <Button variant="ghost" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" icon={Save} disabled={!canSubmit}>
          {update.isPending ? 'Salvando…' : 'Salvar'}
        </Button>
      </div>
    </form>
  );
}

function TaskDetails({ task, onClose }: { task: Task; onClose: () => void }) {
  const canEdit = useCanEditProject();
  return (
    <>
      <div className="flex items-center justify-between gap-3 border-b border-zinc-100 px-5 py-3.5">
        <div className="flex flex-wrap items-center gap-2">
          <TaskStatusPill status={task.status} />
          <SourceBadge task={task} />
        </div>
        <button type="button" onClick={onClose} className="rounded-md p-1 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700" aria-label="Fechar">
          <X className="h-4 w-4" />
        </button>
      </div>
      {canEdit ? <EditableDetails task={task} onClose={onClose} /> : <ReadOnlyDetails task={task} />}
    </>
  );
}

export function TaskDetailsModal({ task }: { task: Task | null }) {
  const close = useUI((s) => s.closeTask);
  return (
    <Modal open={Boolean(task)} onClose={close}>
      {task && <TaskDetails key={task.id} task={task} onClose={close} />}
    </Modal>
  );
}
