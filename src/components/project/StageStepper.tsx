import { Check } from 'lucide-react';
import { cn, formatDate, isOverdue } from '../../lib/utils';
import type { Stage } from '../../types';

interface StageStepperProps {
  stages: Pick<Stage, 'id' | 'title' | 'status' | 'dueDate' | 'completedAt'>[];
  size?: 'sm' | 'lg';
  selectedId?: string;
  onSelect?: (stageId: string) => void;
  className?: string;
}

export function StageStepper({ stages, size = 'sm', selectedId, onSelect, className }: StageStepperProps) {
  const lg = size === 'lg';

  if (!stages.length) {
    return <p className={cn('text-xs text-zinc-400', className)}>Nenhuma etapa definida ainda.</p>;
  }

  return (
    <ol className={cn('flex w-full items-start', className)}>
      {stages.map((stage, index) => {
        const isLast = index === stages.length - 1;
        const selected = stage.id === selectedId;
        const overdue = isOverdue(stage.dueDate, stage.status);
        const Wrapper = onSelect ? 'button' : 'div';

        return (
          <li key={stage.id} className="relative flex min-w-0 flex-1 flex-col items-center">
            {!isLast && (
              <span
                aria-hidden
                className={cn(
                  'absolute left-1/2 h-0.5 w-full',
                  lg ? 'top-[13px]' : 'top-[9px]',
                  stage.status === 'DONE' ? 'bg-emerald-500' : 'bg-zinc-200',
                  stage.status === 'ACTIVE' && 'bg-gradient-to-r from-indigo-400 to-zinc-200',
                )}
              />
            )}

            <Wrapper
              {...(onSelect ? { type: 'button' as const, onClick: () => onSelect(stage.id) } : {})}
              className={cn('group relative z-10 flex flex-col items-center px-1 text-center', onSelect && 'cursor-pointer')}
            >
              <span
                className={cn(
                  'relative flex items-center justify-center rounded-full transition',
                  lg ? 'h-7 w-7' : 'h-5 w-5',
                  stage.status === 'DONE' && 'bg-emerald-500 text-white',
                  stage.status === 'ACTIVE' && 'bg-white ring-2 ring-indigo-500',
                  stage.status === 'PENDING' && 'bg-white text-zinc-400 ring-1 ring-zinc-300',
                  overdue && 'ring-2 ring-amber-500',
                  selected && 'outline-2 outline-offset-2 outline-zinc-900',
                  onSelect && stage.status === 'PENDING' && 'group-hover:ring-zinc-400',
                )}
              >
                {stage.status === 'DONE' && <Check className={lg ? 'h-4 w-4' : 'h-3 w-3'} strokeWidth={3} />}
                {stage.status === 'ACTIVE' && (
                  <>
                    <span className="absolute inset-0 animate-ping rounded-full bg-indigo-400/30" />
                    <span className={cn('rounded-full bg-indigo-500', lg ? 'h-2.5 w-2.5' : 'h-2 w-2')} />
                  </>
                )}
                {stage.status === 'PENDING' && (
                  <span className={cn('font-semibold tabular-nums', lg ? 'text-xs' : 'text-[10px]')}>{index + 1}</span>
                )}
              </span>

              <span
                className={cn(
                  'mt-1.5 line-clamp-2 leading-tight',
                  lg ? 'text-xs' : 'text-[11px]',
                  stage.status === 'DONE' && 'text-zinc-600',
                  stage.status === 'ACTIVE' && 'font-semibold text-indigo-700',
                  stage.status === 'PENDING' && 'text-zinc-400',
                  selected && 'text-zinc-900',
                )}
              >
                {stage.title}
              </span>

              {lg && (
                <span className="mt-0.5 text-[10px] text-zinc-400">
                  {stage.status === 'DONE' && stage.completedAt && `Concluída ${formatDate(stage.completedAt)}`}
                  {stage.status === 'ACTIVE' && <span className="font-medium text-indigo-600">Etapa atual</span>}
                  {stage.status === 'PENDING' && stage.dueDate && (
                    <span className={overdue ? 'font-medium text-amber-600' : undefined}>Prazo {formatDate(stage.dueDate)}</span>
                  )}
                </span>
              )}
            </Wrapper>
          </li>
        );
      })}
    </ol>
  );
}
