import { PRIORITIES, PRIORITY_META } from '../../lib/constants';
import { cn } from '../../lib/utils';
import type { TaskPriority } from '../../types';

export function PriorityPicker({ value, onChange }: { value: TaskPriority; onChange: (priority: TaskPriority) => void }) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {PRIORITIES.map((priority) => {
        const meta = PRIORITY_META[priority];
        const active = value === priority;
        return (
          <button
            key={priority}
            type="button"
            onClick={() => onChange(priority)}
            aria-pressed={active}
            className={cn(
              'flex items-center justify-center gap-1.5 rounded-lg border px-2 py-1.5 text-xs font-medium transition',
              active ? 'border-zinc-900 bg-zinc-900 text-white' : 'border-zinc-200 text-zinc-600 hover:border-zinc-300',
            )}
          >
            <span className={cn('h-1.5 w-1.5 rounded-full', meta.dot)} />
            {meta.label}
          </button>
        );
      })}
    </div>
  );
}
