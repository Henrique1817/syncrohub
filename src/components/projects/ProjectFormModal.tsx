import { useState, type FormEvent } from 'react';
import { AlertCircle, AlertTriangle, Archive, FolderPlus, GitBranch, Pencil, Save, X } from 'lucide-react';
import { getErrorMessage } from '../../api/client';
import { PROJECT_STATUS_META } from '../../lib/constants';
import { cn, pluralize } from '../../lib/utils';
import {
  useArchiveProject,
  useCreateProject,
  usePreviewGitHubRepo,
  useProject,
  useUpdateProject,
} from '../../queries/projects';
import { useUI } from '../../store/ui';
import type { ProjectDetail, ProjectStatus } from '../../types';
import { Button } from '../ui/Button';
import { Field, inputClass } from '../ui/Field';
import { Modal } from '../ui/Modal';
import { PageLoader } from '../ui/States';
import { StageDraftList, newStageDraft, type StageDraft } from './StageDraftList';

const STATUSES = Object.keys(PROJECT_STATUS_META) as ProjectStatus[];

function StatusPicker({ value, onChange }: { value: ProjectStatus; onChange: (status: ProjectStatus) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {STATUSES.map((status) => {
        const meta = PROJECT_STATUS_META[status];
        const active = value === status;
        return (
          <button
            key={status}
            type="button"
            onClick={() => onChange(status)}
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

function FormHeader({ icon: Icon, title, subtitle, onClose }: { icon: typeof Pencil; title: string; subtitle: string; onClose: () => void }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-zinc-100 px-5 py-4">
      <div className="flex items-start gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-900 text-white">
          <Icon className="h-4 w-4" />
        </span>
        <div>
          <h2 className="text-base font-semibold tracking-tight text-zinc-950">{title}</h2>
          <p className="text-sm text-zinc-500">{subtitle}</p>
        </div>
      </div>
      <button type="button" onClick={onClose} className="rounded-md p-1 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700" aria-label="Fechar">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

function ErrorBanner({ error }: { error: unknown }) {
  return (
    <div role="alert" className="flex items-start gap-2 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">
      <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      {getErrorMessage(error)}
    </div>
  );
}

function CreateProjectForm() {
  const close = useUI((s) => s.closeProjectForm);
  const navigate = useUI((s) => s.navigate);
  const toast = useUI((s) => s.toast);
  const create = useCreateProject();
  const previewGitHub = usePreviewGitHubRepo();

  const [repoInput, setRepoInput] = useState('');
  const [githubRepo, setGithubRepo] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [githubDefaultBranch, setGithubDefaultBranch] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<ProjectStatus>('PLANNING');
  const [dueDate, setDueDate] = useState('');
  const [startFirstStage, setStartFirstStage] = useState(false);
  const [drafts, setDrafts] = useState<StageDraft[]>([newStageDraft()]);

  const stages = drafts.filter((d) => d.title.trim());
  const invalidStage = stages.some((d) => d.title.trim().length < 2);
  const canSubmit = name.trim().length >= 3 && !invalidStage && !create.isPending;

  const toggleStart = (checked: boolean) => {
    setStartFirstStage(checked);
    if (checked && status === 'PLANNING') setStatus('IN_PROGRESS');
  };

  const handleImportGitHub = () => {
    const trimmed = repoInput.trim();
    if (!trimmed) return;
    previewGitHub.mutate(
      { repo: trimmed },
      {
        onSuccess: (repo) => {
          setName(repo.name);
          if (repo.description) setDescription(repo.description);
          setGithubRepo(repo.githubRepo);
          setGithubUrl(repo.githubUrl);
          setGithubDefaultBranch(repo.defaultBranch);
          toast('Repositório importado', `${repo.githubRepo} (${repo.defaultBranch})`);
        },
      },
    );
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    create.mutate(
      {
        name: name.trim(),
        description: description.trim() || undefined,
        status,
        dueDate: dueDate || undefined,
        githubRepo: githubRepo || undefined,
        githubUrl: githubUrl || undefined,
        githubDefaultBranch: githubDefaultBranch || undefined,
        stages: stages.map((d) => ({
          title: d.title.trim(),
          description: d.description.trim() || undefined,
          dueDate: d.dueDate || undefined,
        })),
        startFirstStage: startFirstStage && stages.length > 0,
      },
      {
        onSuccess: (project) => {
          toast('Projeto criado', `${pluralize(project.totalStages, 'etapa', 'etapas')} no roadmap.`);
          close();
          navigate({ name: 'project', projectId: project.id });
        },
      },
    );
  };

  return (
    <form onSubmit={handleSubmit}>
      <FormHeader
        icon={FolderPlus}
        title="Novo projeto"
        subtitle="Defina o objetivo e as etapas que os gestores vão acompanhar."
        onClose={close}
      />

      <div className="space-y-5 px-5 py-5">
        {create.isError && <ErrorBanner error={create.error} />}
        {previewGitHub.isError && <ErrorBanner error={previewGitHub.error} />}

        <div className="rounded-lg border border-zinc-200 bg-zinc-50/70 p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-700">
              <GitBranch className="h-3.5 w-3.5 text-zinc-500" />
              Importar do GitHub (opcional)
            </span>
            {githubRepo && <span className="text-[11px] font-medium text-emerald-700">Vinculado: {githubRepo}</span>}
          </div>
          <div className="mt-2 flex gap-2">
            <input
              value={repoInput}
              onChange={(e) => setRepoInput(e.target.value)}
              placeholder="usuario/repositorio ou https://github.com/usuario/repositorio"
              className={inputClass}
            />
            <Button
              type="button"
              variant="secondary"
              disabled={!repoInput.trim() || previewGitHub.isPending}
              onClick={handleImportGitHub}
            >
              {previewGitHub.isPending ? 'Buscando…' : 'Buscar'}
            </Button>
          </div>
          <p className="mt-1.5 text-[11px] text-zinc-500">
            Preenche nome, repositório e descrição (README) automaticamente.
          </p>
        </div>

        <Field label="Nome do projeto" hint="Mínimo 3 caracteres" htmlFor="project-name">
          <input
            id="project-name"
            autoFocus
            maxLength={160}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex.: Migração da Core API para Edge Runtime"
            className={inputClass}
          />
        </Field>

        <Field label="Objetivo" hint="Opcional · visível para os gestores" htmlFor="project-description">
          <textarea
            id="project-description"
            rows={3}
            maxLength={5000}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Qual resultado de negócio este projeto entrega? Ex.: reduzir a latência p95 de 420ms para 120ms."
            className={inputClass}
          />
        </Field>

        <div className="grid gap-5 sm:grid-cols-[1fr_180px]">
          <Field label="Status inicial">
            <StatusPicker value={status} onChange={setStatus} />
          </Field>
          <Field label="Entrega prevista" hint="Opcional" htmlFor="project-due">
            <input
              id="project-due"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className={cn(inputClass, 'py-1.5 text-zinc-700')}
            />
          </Field>
        </div>

        <StageDraftList drafts={drafts} onChange={setDrafts} />

        {stages.length > 0 && (
          <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-zinc-200 px-3 py-2.5">
            <input
              type="checkbox"
              checked={startFirstStage}
              onChange={(e) => toggleStart(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-zinc-900"
            />
            <span>
              <span className="block text-sm font-medium text-zinc-800">Já iniciar a primeira etapa</span>
              <span className="block text-xs text-zinc-500">
                "{stages[0].title.trim()}" aparece como etapa atual no roadmap dos gestores.
              </span>
            </span>
          </label>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-b-xl border-t border-zinc-100 bg-zinc-50/80 px-5 py-3">
        <p className="text-xs text-zinc-500">
          {stages.length ? pluralize(stages.length, 'etapa será criada', 'etapas serão criadas') : 'Você pode adicionar etapas depois.'}
        </p>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={close}>
            Cancelar
          </Button>
          <Button type="submit" icon={FolderPlus} disabled={!canSubmit}>
            {create.isPending ? 'Criando…' : 'Criar projeto'}
          </Button>
        </div>
      </div>
    </form>
  );
}

function ArchiveProjectZone({ project }: { project: ProjectDetail }) {
  const close = useUI((s) => s.closeProjectForm);
  const toast = useUI((s) => s.toast);
  const archive = useArchiveProject(project.id);
  const [confirming, setConfirming] = useState(false);

  const handleArchive = () =>
    archive.mutate(undefined, {
      onSuccess: () => {
        toast('Projeto arquivado', 'Ele continua acessível em "Arquivados", na barra lateral.');
        close();
      },
    });

  return (
    <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
      {archive.isError && <ErrorBanner error={archive.error} />}
      {confirming ? (
        <div className="space-y-3">
          <p className="flex items-start gap-2 text-xs text-zinc-700">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
            O projeto sai do roadmap e deixa de receber demandas e ideias. Etapas, tasks e histórico são preservados e você
            pode restaurá-lo quando quiser.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setConfirming(false)}>
              Cancelar
            </Button>
            <Button size="sm" icon={Archive} disabled={archive.isPending} onClick={handleArchive}>
              {archive.isPending ? 'Arquivando…' : 'Arquivar projeto'}
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-zinc-900">Arquivar projeto</p>
            <p className="text-xs text-zinc-500">Tira do roadmap sem apagar nada. A exclusão definitiva fica no arquivo.</p>
          </div>
          <Button variant="secondary" size="sm" icon={Archive} onClick={() => setConfirming(true)}>
            Arquivar
          </Button>
        </div>
      )}
    </div>
  );
}

function EditProjectForm({ project }: { project: ProjectDetail }) {
  const close = useUI((s) => s.closeProjectForm);
  const toast = useUI((s) => s.toast);
  const update = useUpdateProject(project.id);

  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description ?? '');
  const [status, setStatus] = useState<ProjectStatus>(project.status);
  const [dueDate, setDueDate] = useState(project.dueDate ?? '');

  // PATCH exige ao menos um campo: enviamos só o que mudou.
  const patch = {
    ...(name.trim() !== project.name && { name: name.trim() }),
    ...(description.trim() !== (project.description ?? '') && { description: description.trim() || null }),
    ...(status !== project.status && { status }),
    ...(dueDate !== (project.dueDate ?? '') && { dueDate: dueDate || null }),
  };
  const hasChanges = Object.keys(patch).length > 0;
  const canSubmit = name.trim().length >= 3 && hasChanges && !update.isPending;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    update.mutate(patch, {
      onSuccess: () => {
        toast('Projeto atualizado');
        close();
      },
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <FormHeader icon={Pencil} title="Editar projeto" subtitle="As etapas são editadas direto na tela do projeto." onClose={close} />

      <div className="space-y-5 px-5 py-5">
        {update.isError && <ErrorBanner error={update.error} />}

        <Field label="Nome do projeto" htmlFor="project-name">
          <input
            id="project-name"
            autoFocus
            maxLength={160}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
          />
        </Field>

        <Field label="Objetivo" hint="Opcional" htmlFor="project-description">
          <textarea
            id="project-description"
            rows={3}
            maxLength={5000}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={inputClass}
          />
        </Field>

        <Field label="Status">
          <StatusPicker value={status} onChange={setStatus} />
        </Field>

        <Field label="Entrega prevista" hint="Opcional" htmlFor="project-due">
          <div className="flex gap-2">
            <input
              id="project-due"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className={cn(inputClass, 'text-zinc-700')}
            />
            {dueDate && (
              <Button variant="ghost" onClick={() => setDueDate('')}>
                Limpar
              </Button>
            )}
          </div>
        </Field>

        <ArchiveProjectZone project={project} />
      </div>

      <div className="flex justify-end gap-2 rounded-b-xl border-t border-zinc-100 bg-zinc-50/80 px-5 py-3">
        <Button variant="ghost" onClick={close}>
          Cancelar
        </Button>
        <Button type="submit" icon={Save} disabled={!canSubmit}>
          {update.isPending ? 'Salvando…' : 'Salvar alterações'}
        </Button>
      </div>
    </form>
  );
}

function EditProjectLoader({ projectId }: { projectId: string }) {
  const project = useProject(projectId);
  if (!project.data) return <PageLoader label="Carregando projeto…" />;
  return <EditProjectForm project={project.data} />;
}

export function ProjectFormModal() {
  const { open, projectId, nonce } = useUI((s) => s.projectForm);
  const close = useUI((s) => s.closeProjectForm);

  return (
    <Modal open={open} onClose={close} size={projectId ? 'md' : 'lg'}>
      {projectId ? <EditProjectLoader key={nonce} projectId={projectId} /> : <CreateProjectForm key={nonce} />}
    </Modal>
  );
}
