import type { ReactNode } from 'react';
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import { cn, uid } from '../../lib/utils';
import { Button } from '../ui/Button';
import { inputClass } from '../ui/Field';

export interface StageDraft {
  key: string;
  title: string;
  description: string;
  dueDate: string;
}

export const newStageDraft = (title = ''): StageDraft => ({ key: uid('draft'), title, description: '', dueDate: '' });

const TEMPLATE = ['Discovery & Requisitos', 'Arquitetura', 'Implementação', 'Homologação', 'Go-live'];

const MAX_STAGES = 50;

interface StageDraftListProps {
  drafts: StageDraft[];
  onChange: (drafts: StageDraft[]) => void;
}

export function StageDraftList({ drafts, onChange }: StageDraftListProps) {
  const update = (key: string, patch: Partial<StageDraft>) =>
    onChange(drafts.map((d) => (d.key === key ? { ...d, ...patch } : d)));

  const move = (index: number, delta: -1 | 1) => {
    const next = [...drafts];
    [next[index], next[index + delta]] = [next[index + delta], next[index]];
    onChange(next);
  };

  const isEmpty = drafts.every((d) => !d.title.trim());

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-zinc-700">
          Etapas do roadmap <span className="font-normal text-zinc-400">· na ordem de execução</span>
        </p>
        {isEmpty && (
          <button
            type="button"
            onClick={() => onChange(TEMPLATE.map((title) => newStageDraft(title)))}
            className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
          >
            Usar modelo padrão
          </button>
        )}
      </div>

      <ol className="space-y-2">
        {drafts.map((draft, index) => (
          <li key={draft.key} className="rounded-lg border border-zinc-200 bg-zinc-50/50 p-2.5">
            <div className="flex items-start gap-2">
              <span className="mt-2 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white text-[10px] font-semibold text-zinc-500 ring-1 ring-zinc-200 tabular-nums">
                {index + 1}
              </span>
              <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-[1fr_150px]">
                <input
                  value={draft.title}
                  onChange={(e) => update(draft.key, { title: e.target.value })}
                  placeholder={index === 0 ? 'Ex.: Discovery & Requisitos' : 'Nome da etapa'}
                  maxLength={160}
                  aria-label={`Nome da etapa ${index + 1}`}
                  className={cn(inputClass, 'py-1.5')}
                />
                <input
                  type="date"
                  value={draft.dueDate}
                  onChange={(e) => update(draft.key, { dueDate: e.target.value })}
                  aria-label={`Prazo da etapa ${index + 1}`}
                  title="Prazo (opcional)"
                  className={cn(inputClass, 'py-1.5 text-zinc-600')}
                />
                <input
                  value={draft.description}
                  onChange={(e) => update(draft.key, { description: e.target.value })}
                  placeholder="Descrição curta (opcional)"
                  maxLength={2000}
                  aria-label={`Descrição da etapa ${index + 1}`}
                  className={cn(inputClass, 'py-1.5 text-xs sm:col-span-2')}
                />
              </div>
              <div className="flex shrink-0 flex-col gap-0.5">
                <IconButton label="Mover para cima" disabled={index === 0} onClick={() => move(index, -1)}>
                  <ArrowUp className="h-3.5 w-3.5" />
                </IconButton>
                <IconButton label="Mover para baixo" disabled={index === drafts.length - 1} onClick={() => move(index, 1)}>
                  <ArrowDown className="h-3.5 w-3.5" />
                </IconButton>
                <IconButton
                  label="Remover etapa"
                  disabled={drafts.length === 1}
                  onClick={() => onChange(drafts.filter((d) => d.key !== draft.key))}
                  danger
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </IconButton>
              </div>
            </div>
          </li>
        ))}
      </ol>

      <Button
        variant="secondary"
        size="sm"
        icon={Plus}
        disabled={drafts.length >= MAX_STAGES}
        onClick={() => onChange([...drafts, newStageDraft()])}
      >
        Adicionar etapa
      </Button>
    </div>
  );
}

function IconButton({
  label,
  disabled,
  danger,
  onClick,
  children,
}: {
  label: string;
  disabled?: boolean;
  danger?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'rounded-md p-1 text-zinc-400 transition disabled:opacity-30',
        danger ? 'hover:bg-rose-50 hover:text-rose-600' : 'hover:bg-white hover:text-zinc-700',
      )}
    >
      {children}
    </button>
  );
}
