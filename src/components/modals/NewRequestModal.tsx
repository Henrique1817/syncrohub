import { useState, type FormEvent, type KeyboardEvent } from 'react';
import { AlertCircle, Info, Lightbulb, ListPlus, Send, X } from 'lucide-react';
import { getErrorMessage } from '../../api/client';
import { IDEA_CATEGORIES, IDEA_CATEGORY_META } from '../../lib/constants';
import { canCreateTasks } from '../../lib/permissions';
import { getCurrentStage, sortStages } from '../../lib/selectors';
import { cn } from '../../lib/utils';
import { useCreateIdea } from '../../queries/ideas';
import { useProject, useProjects } from '../../queries/projects';
import { useCreateTask } from '../../queries/tasks';
import { useCurrentUser } from '../../store/session';
import { useUI } from '../../store/ui';
import type { IdeaCategory, RequestMode, TaskPriority } from '../../types';
import { Button } from '../ui/Button';
import { DateRangeFields, isValidDateRange } from '../ui/DateRangeFields';
import { Field, inputClass } from '../ui/Field';
import { PriorityPicker } from '../ui/PriorityPicker';
import { Modal } from '../ui/Modal';
import { SegmentedControl } from '../ui/SegmentedControl';

const AUTO_STAGE = '';

function RequestForm() {
  const modal = useUI((s) => s.modal);
  const closeModal = useUI((s) => s.closeModal);
  const toast = useUI((s) => s.toast);
  const role = useCurrentUser().role;
  const isManager = role !== 'ENGINEER';
  const allowTasks = canCreateTasks(role);

  const projects = useProjects();
  const createTask = useCreateTask();
  const createIdea = useCreateIdea();

  const [mode, setMode] = useState<RequestMode>(allowTasks ? modal.mode : 'IDEA');
  const [projectId, setProjectId] = useState(modal.projectId ?? '');
  const [pickedStageId, setPickedStageId] = useState<string | undefined>(modal.stageId);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('MEDIUM');
  const [startDate, setStartDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [category, setCategory] = useState<IdeaCategory>('IDEA');

  const project = useProject(projectId || undefined);
  const stages = sortStages(project.data?.stages ?? []);
  // Gestor: por padrão deixa a etapa para a triagem. Engenheiro: etapa atual do projeto.
  const stageId = pickedStageId ?? (isManager ? AUTO_STAGE : (getCurrentStage(stages)?.id ?? AUTO_STAGE));

  const isTask = mode === 'TASK';
  const mutation = isTask ? createTask : createIdea;
  const canSubmit =
    title.trim().length >= 3 &&
    (isTask ? Boolean(projectId) && isValidDateRange(startDate, dueDate) : description.trim().length >= 3) &&
    !mutation.isPending;

  const submit = () => {
    if (!canSubmit) return;
    const onSuccess = () => {
      toast(
        isTask ? (isManager ? 'Demanda enviada ao engenheiro' : 'Task criada') : 'Ideia enviada',
        isTask && isManager ? 'Ela entra na triagem para definir a etapa.' : undefined,
      );
      closeModal();
    };

    if (isTask) {
      createTask.mutate(
        {
          projectId,
          input: {
            title: title.trim(),
            description: description.trim() || undefined,
            priority,
            stageId: stageId || undefined,
            startDate: startDate || undefined,
            dueDate: dueDate || undefined,
          },
        },
        { onSuccess },
      );
    } else {
      createIdea.mutate(
        { projectId: projectId || undefined, category, title: title.trim(), content: description.trim() },
        { onSuccess },
      );
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    submit();
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit();
  };

  const switchMode = (next: RequestMode) => {
    setMode(next);
    createTask.reset();
    createIdea.reset();
  };

  return (
    <form onSubmit={handleSubmit} onKeyDown={handleKeyDown}>
      <div className="flex items-center justify-between gap-3 border-b border-zinc-100 px-5 py-3.5">
        {allowTasks ? (
          <SegmentedControl<RequestMode>
            value={mode}
            onChange={switchMode}
            options={[
              { value: 'TASK', label: isManager ? 'Task / Demanda' : 'Nova task', icon: ListPlus },
              { value: 'IDEA', label: 'Ideia / Sugestão', icon: Lightbulb },
            ]}
          />
        ) : (
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-700">
            <Lightbulb className="h-4 w-4 text-amber-500" />
            Ideia / Sugestão
          </span>
        )}
        <button type="button" onClick={closeModal} className="rounded-md p-1 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700" aria-label="Fechar">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-4 px-5 py-5">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-zinc-950">
            {isTask ? (isManager ? 'Adicionar uma demanda' : 'Criar task') : 'Enviar uma ideia ou sugestão'}
          </h2>
          <p className="mt-0.5 text-sm text-zinc-500">
            {isTask
              ? isManager
                ? 'Descreva o que precisa ser feito. O engenheiro define a etapa e o encaixe na fila.'
                : 'A task entra direto no quadro da etapa selecionada.'
              : 'Não precisa estar pronta: o engenheiro avalia a viabilidade e responde com um parecer.'}
          </p>
        </div>

        {mutation.isError && (
          <div role="alert" className="flex items-start gap-2 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {getErrorMessage(mutation.error)}
          </div>
        )}

        {!isTask && (
          <div className="grid grid-cols-3 gap-2">
            {IDEA_CATEGORIES.map((c) => {
              const meta = IDEA_CATEGORY_META[c];
              const Icon = meta.icon;
              const active = category === c;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  className={cn(
                    'flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition',
                    active ? 'border-indigo-300 bg-indigo-50/60 ring-4 ring-indigo-500/10' : 'border-zinc-200 hover:border-zinc-300',
                  )}
                >
                  <Icon className={cn('h-4 w-4', active ? 'text-indigo-600' : 'text-zinc-400')} />
                  <span className="text-sm font-medium text-zinc-900">{meta.label}</span>
                  <span className="text-[11px] leading-tight text-zinc-500">{meta.hint}</span>
                </button>
              );
            })}
          </div>
        )}

        <Field label="Título" htmlFor="req-title" hint="Mínimo 3 caracteres">
          <input
            id="req-title"
            autoFocus
            maxLength={200}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={isTask ? 'Ex.: Relatório de vendas por região no dashboard' : 'Ex.: Alertar no Slack quando o checkout ficar lento'}
            className={inputClass}
          />
        </Field>

        <Field label={isTask ? 'Contexto' : 'Descrição'} hint={isTask ? 'Opcional' : 'Obrigatória'} htmlFor="req-desc">
          <textarea
            id="req-desc"
            rows={3}
            maxLength={5000}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={
              isTask
                ? 'Qual problema isso resolve, quem é impactado e se existe prazo.'
                : 'Qual o benefício esperado? Algum exemplo ou referência?'
            }
            className={inputClass}
          />
        </Field>

        <div className={cn('grid gap-3', isTask && 'sm:grid-cols-2')}>
          <Field label="Projeto" hint={isTask ? undefined : 'Opcional'}>
            <select
              value={projectId}
              onChange={(e) => {
                setProjectId(e.target.value);
                setPickedStageId(undefined);
              }}
              className={inputClass}
            >
              <option value="" disabled={isTask}>
                {projects.isPending ? 'Carregando…' : isTask ? 'Selecione um projeto' : 'Geral · sem projeto específico'}
              </option>
              {projects.data?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </Field>

          {isTask && (
            <Field label={isManager ? 'Etapa sugerida' : 'Etapa'}>
              <select
                value={stageId}
                onChange={(e) => setPickedStageId(e.target.value)}
                disabled={!projectId || project.isPending}
                className={cn(inputClass, 'disabled:bg-zinc-50 disabled:text-zinc-400')}
              >
                <option value={AUTO_STAGE}>{isManager ? 'Deixar o engenheiro definir' : 'Sem etapa'}</option>
                {stages.map((s, index) => (
                  <option key={s.id} value={s.id}>
                    {index + 1}. {s.title}
                    {s.status === 'ACTIVE' ? ' (atual)' : ''}
                  </option>
                ))}
              </select>
            </Field>
          )}
        </div>

        {isTask && (
          <>
            <Field label={isManager ? 'Urgência' : 'Prioridade'}>
              <PriorityPicker value={priority} onChange={setPriority} />
            </Field>
            <DateRangeFields
              idPrefix="req"
              startDate={startDate}
              dueDate={dueDate}
              onStartChange={setStartDate}
              onDueChange={setDueDate}
              dueLabel={isManager ? 'Prazo desejado' : 'Entrega'}
            />
          </>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-b-xl border-t border-zinc-100 bg-zinc-50/80 px-5 py-3">
        <p className="flex items-center gap-1.5 text-xs text-zinc-500">
          <Info className="h-3.5 w-3.5" />
          {isManager && isTask ? 'Toda demanda passa pela triagem do engenheiro.' : 'Ctrl + Enter para enviar'}
        </p>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={closeModal}>
            Cancelar
          </Button>
          <Button type="submit" icon={Send} disabled={!canSubmit}>
            {mutation.isPending ? 'Enviando…' : isTask ? (isManager ? 'Enviar demanda' : 'Criar task') : 'Enviar ideia'}
          </Button>
        </div>
      </div>
    </form>
  );
}

export function NewRequestModal() {
  const open = useUI((s) => s.modal.open);
  const nonce = useUI((s) => s.modal.nonce);
  const closeModal = useUI((s) => s.closeModal);

  return (
    <Modal open={open} onClose={closeModal}>
      <RequestForm key={nonce} />
    </Modal>
  );
}
