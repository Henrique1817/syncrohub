import { cn } from '../../lib/utils';
import { Field, inputClass } from './Field';

/** Datas 'YYYY-MM-DD' comparam corretamente como texto. */
export const isValidDateRange = (start: string, due: string) => !start || !due || start <= due;

interface DateRangeFieldsProps {
  startDate: string;
  dueDate: string;
  onStartChange: (value: string) => void;
  onDueChange: (value: string) => void;
  idPrefix: string;
  dueLabel?: string;
}

export function DateRangeFields({ startDate, dueDate, onStartChange, onDueChange, idPrefix, dueLabel = 'Entrega' }: DateRangeFieldsProps) {
  const invalid = !isValidDateRange(startDate, dueDate);
  return (
    <div className="space-y-1.5">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Início" hint="Opcional" htmlFor={`${idPrefix}-start`}>
          <input
            id={`${idPrefix}-start`}
            type="date"
            value={startDate}
            max={dueDate || undefined}
            onChange={(e) => onStartChange(e.target.value)}
            className={cn(inputClass, 'py-1.5 text-zinc-700')}
          />
        </Field>
        <Field label={dueLabel} hint="Opcional" htmlFor={`${idPrefix}-due`}>
          <input
            id={`${idPrefix}-due`}
            type="date"
            value={dueDate}
            min={startDate || undefined}
            onChange={(e) => onDueChange(e.target.value)}
            aria-invalid={invalid}
            className={cn(inputClass, 'py-1.5 text-zinc-700', invalid && 'border-rose-300 focus:border-rose-400 focus:ring-rose-500/10')}
          />
        </Field>
      </div>
      {invalid && <p className="text-xs text-rose-600">A data de início não pode ser posterior à data de entrega.</p>}
    </div>
  );
}
