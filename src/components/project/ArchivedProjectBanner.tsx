import { useState } from 'react';
import { AlertTriangle, Archive, ArchiveRestore, Trash2 } from 'lucide-react';
import { getErrorMessage } from '../../api/client';
import { formatDate, pluralize } from '../../lib/utils';
import { useDeleteProject, useRestoreProject } from '../../queries/projects';
import { useCurrentUser } from '../../store/session';
import { useUI } from '../../store/ui';
import type { ProjectDetail } from '../../types';
import { Button } from '../ui/Button';

export function ArchivedProjectBanner({ project }: { project: ProjectDetail }) {
  const isEngineer = useCurrentUser().role === 'ENGINEER';
  const navigate = useUI((s) => s.navigate);
  const toast = useUI((s) => s.toast);
  const restore = useRestoreProject(project.id);
  const remove = useDeleteProject(project.id);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const error = restore.error ?? remove.error;

  if (!project.archivedAt) return null;

  const handleDelete = () =>
    remove.mutate(undefined, {
      onSuccess: () => {
        toast('Projeto excluído definitivamente', project.name);
        navigate({ name: 'dashboard' });
      },
    });

  return (
    <div className="rounded-xl border border-zinc-300 bg-zinc-100/80 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-200 text-zinc-600">
            <Archive className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-semibold text-zinc-900">Projeto arquivado em {formatDate(project.archivedAt)}</p>
            <p className="text-xs text-zinc-600">
              Somente leitura: não recebe novas demandas, tasks ou ideias e não aparece no roadmap.
            </p>
          </div>
        </div>
        {isEngineer && !confirmingDelete && (
          <div className="flex gap-2">
            <Button variant="danger" size="sm" icon={Trash2} onClick={() => setConfirmingDelete(true)}>
              Excluir definitivamente
            </Button>
            <Button
              size="sm"
              icon={ArchiveRestore}
              disabled={restore.isPending}
              onClick={() => restore.mutate(undefined, { onSuccess: () => toast('Projeto restaurado', project.name) })}
            >
              {restore.isPending ? 'Restaurando…' : 'Restaurar'}
            </Button>
          </div>
        )}
      </div>

      {error && <p className="mt-3 text-xs text-rose-700">{getErrorMessage(error)}</p>}

      {confirmingDelete && (
        <div className="mt-4 space-y-3 rounded-lg border border-rose-200 bg-white p-3">
          <p className="flex items-start gap-2 text-xs text-rose-800">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Isso apaga para sempre {pluralize(project.totalStages, 'etapa', 'etapas')}, todas as tasks, comentários e o
            histórico do projeto. Ideias vinculadas continuam na central, sem projeto.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setConfirmingDelete(false)}>
              Cancelar
            </Button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={remove.isPending}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-rose-600 px-2.5 text-xs font-medium text-white shadow-sm transition hover:bg-rose-500 disabled:bg-rose-300"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {remove.isPending ? 'Excluindo…' : 'Excluir para sempre'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
