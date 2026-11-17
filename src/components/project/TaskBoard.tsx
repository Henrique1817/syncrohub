import { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { BOARD_STATUSES, TASK_STATUS_META } from '../../lib/constants';
import { cn } from '../../lib/utils';
import { useChangeTaskStatus } from '../../queries/tasks';
import { useCanEditProject } from './ProjectAccess';
import type { Task, TaskStatus } from '../../types';
import { TaskCard } from './TaskCard';

function DraggableTask({ task, editable }: { task: Task; editable: boolean }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: task.id, disabled: !editable });
  return (
    <div
      ref={setNodeRef}
      {...(editable ? { ...attributes, ...listeners } : {})}
      className={cn(editable && 'cursor-grab touch-none active:cursor-grabbing', isDragging && 'opacity-40')}
    >
      <TaskCard task={task} />
    </div>
  );
}

function BoardColumn({ status, tasks, editable }: { status: TaskStatus; tasks: Task[]; editable: boolean }) {
  const { setNodeRef, isOver } = useDroppable({ id: status, disabled: !editable });
  const meta = TASK_STATUS_META[status];

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex w-[272px] shrink-0 flex-col rounded-xl bg-zinc-100/70 p-2 ring-1 ring-zinc-200/70 transition-colors ring-inset xl:w-auto xl:min-w-[220px] xl:flex-1',
        isOver && 'bg-indigo-50 ring-indigo-300',
      )}
    >
      <div className="flex items-center gap-2 px-1.5 pt-1 pb-2.5">
        <span className={cn('h-2 w-2 rounded-full', meta.dot)} />
        <span className="text-xs font-semibold text-zinc-700">{meta.label}</span>
        <span className="text-xs text-zinc-400 tabular-nums">{tasks.length}</span>
      </div>
      <div className="flex min-h-28 flex-col gap-2">
        {tasks.map((task) => (
          <DraggableTask key={task.id} task={task} editable={editable} />
        ))}
        {tasks.length === 0 && (
          <p className="rounded-lg border border-dashed border-zinc-300 px-3 py-6 text-center text-[11px] text-zinc-400">
            {editable ? 'Arraste tasks para cá' : 'Nenhuma task'}
          </p>
        )}
      </div>
    </div>
  );
}

export function TaskBoard({ projectId, tasks }: { projectId: string; tasks: Task[] }) {
  const editable = useCanEditProject();
  const changeStatus = useChangeTaskStatus(projectId);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const activeTask = tasks.find((t) => t.id === activeId);

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveId(null);
    const task = tasks.find((t) => t.id === active.id);
    if (!over || !task || task.status === over.id) return;
    changeStatus.mutate({ taskId: task.id, status: over.id as TaskStatus });
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={({ active }) => setActiveId(String(active.id))}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-2">
        {BOARD_STATUSES.map((status) => (
          <BoardColumn key={status} status={status} tasks={tasks.filter((t) => t.status === status)} editable={editable} />
        ))}
      </div>
      <DragOverlay dropAnimation={null}>{activeTask ? <TaskCard task={activeTask} overlay /> : null}</DragOverlay>
    </DndContext>
  );
}
