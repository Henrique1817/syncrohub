import { AlertCircle, CheckCircle2, X } from 'lucide-react';
import { useUI } from '../../store/ui';

export function Toaster() {
  const toasts = useUI((s) => s.toasts);
  const dismiss = useUI((s) => s.dismissToast);

  return (
    <div className="pointer-events-none fixed right-4 bottom-4 z-[60] flex w-80 flex-col gap-2">
      {toasts.map((t) => {
        const Icon = t.tone === 'error' ? AlertCircle : CheckCircle2;
        return (
          <div
            key={t.id}
            role={t.tone === 'error' ? 'alert' : 'status'}
            className="pointer-events-auto flex items-start gap-3 rounded-lg border border-zinc-200 bg-white p-3 shadow-lg animate-toast-in"
          >
            <Icon className={t.tone === 'error' ? 'mt-0.5 h-4 w-4 shrink-0 text-rose-500' : 'mt-0.5 h-4 w-4 shrink-0 text-emerald-500'} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-zinc-900">{t.title}</p>
              {t.description && <p className="mt-0.5 text-xs text-zinc-500">{t.description}</p>}
            </div>
            <button onClick={() => dismiss(t.id)} className="text-zinc-400 hover:text-zinc-700" aria-label="Fechar">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
