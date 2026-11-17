import { useState, type FormEvent } from 'react';
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { restrictToParentElement, restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Check, GripVertical, Lock, Pencil, Play, Plus, RotateCcw, type LucideIcon } from 'lucide-react';
import { STAGE_STATUS_META } from '../../lib/constants';
import { stagePercent } from '../../lib/selectors';
import { cn, formatDate, isOverdue } from '../../lib/utils';
import { useChangeStageStatus, useCreateStage, useReorderStages } from '../../queries/stages';
import { useCanEditProject } from './ProjectAccess';
import type { StageStatus, StageWithStats } from '../../types';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { inputClass } from '../ui/Field';
import { ProgressBar } from '../ui/ProgressBar';
import { StageEditModal } from './StageEditModal';
import { StageStatusIcon } from './StageStatusIcon';

/** Ações explícitas: concluir uma etapa ativa a próxima no servidor, então não deve depender de um <select>. */
const STAGE_ACTION: Record<StageStatus, { label: string; to: StageStatus; icon: LucideIcon }> = {
  PENDING: { label: 'Iniciar', to: 'ACTIVE', icon: Play },
  ACTIVE: { label: 'Concluir', to: 'DONE', icon: Check },
  DONE: { label: 'Reabrir', to: 'ACTIVE', icon: RotateCcw },
};

interface StageItemProps {
  stage: StageWithStats;
  selected: boolean;
  editable: boolean;
  onSelect: () => void;
  onEdit: () => void;
}

function StageItem({ stage, selected, editable, onSelect, onEdit }: StageItemProps) {
  const changeStatus = useChangeStageStatus();
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: stage.id,
    disabled: !editable,
  });
  const overdue = isOverdue(stage.dueDate, stage.status);
  const action = STAGE_ACTION[stage.status];

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        'relative rounded-lg border transition-colors',
        selected ? 'border-indigo-200 bg-indigo-50/60' : 'border-transparent hover:bg-zinc-50',
        isDragging && 'z-20 border-zinc-200 bg-white shadow-lg',
      )}
    >
      <div className="flex items-start gap-2 p-2.5">
        {editable && (
          <button
            ref={setActivatorNodeRef}
            {...attributes}
            {...listeners}
            className="mt-0.5 cursor-grab touch-none text-zinc-300 transition hover:text-zinc-600 active:cursor-grabbing"
            aria-label={`Reordenar etapa ${stage.title}`}
          >
            <GripVertical className="h-4 w-4" />
          </button>
        )}
        <StageStatusIcon status={stage.status} className="mt-0.5" />
        <button type="button" onClick={onSelect} className="min-w-0 flex-1 text-left">
          <p className={cn('truncate text-sm font-medium', stage.status === 'PENDING' ? 'text-zinc-500' : 'text-zinc-900')}>
            {stage.title}
          </p>
          {stage.description && <p className="truncate text-[11px] text-zinc-500">{stage.description}</p>}
          {stage.dueDate && stage.status !== 'DONE' && (
            <p className={cn('text-[11px]', overdue ? 'font-medium text-amber-600' : 'text-zinc-400')}>
              {overdue ? 'Atrasada · ' : 'Prazo · '}
              {formatDate(stage.dueDate)}
            </p>
          )}
          <div className="mt-2 flex items-center gap-2">
            <ProgressBar
              value={stagePercent(stage)}
              barClassName={stage.status === 'DONE' ? 'bg-emerald-500' : 'bg-indigo-500'}
              size="xs"
            />
            <span className="text-[11px] text-zinc-500 tabular-nums">
              {stage.doneTasks}/{stage.totalTasks}
            </span>
          </div>
        </button>
      </div>

      {editable && (
        <div className="flex items-center gap-2 pr-2.5 pb-2.5 pl-[3.25rem]">
          <Badge tone={STAGE_STATUS_META[stage.status].tone}>{STAGE_STATUS_META[stage.status].label}</Badge>
          <Button
            variant="secondary"
            size="xs"
            icon={action.icon}
            disabled={changeStatus.isPending}
            onClick={() => changeStatus.mutate({ stageId: stage.id, status: action.to })}
          >
            {action.label}
          </Button>
          <button
            type="button"
            onClick={onEdit}
            className="ml-auto rounded-md p-1 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700"
            aria-label={`Editar etapa ${stage.title}`}
            title="Editar etapa"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </li>
  );
}

function AddStageForm({ projectId }: { projectId: string }) {
  const createStage = useCreateStage(projectId);
  const [title, setTitle] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (title.trim().length < 2) return;
    createStage.mutate({ title: title.trim() }, { onSuccess: () => setTitle('') });
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 border-t border-zinc-100 p-3">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Nova etapa…"
        className={cn(inputClass, 'h-8 py-1 text-xs')}
      />
      <button
        type="submit"
        disabled={title.trim().length < 2 || createStage.isPending}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-900 text-white transition hover:bg-zinc-800 disabled:bg-zinc-200"
        aria-label="Adicionar etapa"
      >
        <Plus className="h-4 w-4" />
      </button>
    </form>
  );
}

interface StageRailProps {
  projectId: string;
  stages: StageWithStats[];
  selectedId?: string;
  onSelect: (stageId: string) => void;
}

export function StageRail({ projectId, stages, selectedId, onSelect }: StageRailProps) {
  const editable = useCanEditProject();
  const reorder = useReorderStages(projectId);
  const [editingId, setEditingId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const ids = stages.map((s) => s.id);
    reorder.mutate(arrayMove(ids, ids.indexOf(String(active.id)), ids.indexOf(String(over.id))));
  };

  return (
    <aside className="h-fit rounded-xl border border-zinc-200 bg-white shadow-xs lg:sticky lg:top-20">
      <header className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
        <div>
          <h3 className="text-sm font-semibold">Etapas</h3>
          <p className="text-[11px] text-zinc-500">{editable ? 'Arraste para reordenar' : 'Definidas pelo engenheiro'}</p>
        </div>
        {editable ? (
          <Badge tone="indigo" icon={GripVertical}>
            Editável
          </Badge>
        ) : (
          <Badge icon={Lock}>Somente leitura</Badge>
        )}
      </header>

      {stages.length === 0 && <p className="px-4 py-4 text-xs text-zinc-400">Nenhuma etapa cadastrada.</p>}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        modifiers={[restrictToVerticalAxis, restrictToParentElement]}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={stages.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          <ul className="space-y-0.5 p-2">
            {stages.map((stage) => (
              <StageItem
                key={stage.id}
                stage={stage}
                selected={stage.id === selectedId}
                editable={editable}
                onSelect={() => onSelect(stage.id)}
                onEdit={() => setEditingId(stage.id)}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>

      {editable && <AddStageForm projectId={projectId} />}
      <StageEditModal stage={stages.find((s) => s.id === editingId) ?? null} onClose={() => setEditingId(null)} />
    </aside>
  );
}
