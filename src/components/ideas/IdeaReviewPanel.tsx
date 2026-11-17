import { useState } from 'react';
import { ArrowRight, Archive, CheckCheck, Flag, MessageSquareText, RotateCcw, Zap } from 'lucide-react';
import { getCurrentStage, sortStages } from '../../lib/selectors';
import { useApproveIdea, useChangeIdeaStatus, useIdeaFeedback } from '../../queries/ideas';
import { useProject, useProjects } from '../../queries/projects';
import type { Idea } from '../../types';
import { Button } from '../ui/Button';
import { Field, inputClass } from '../ui/Field';

/** Ações do engenheiro: parecer, aprovação (= conversão em task) e mudança de status. */
export function IdeaReviewPanel({ idea }: { idea: Idea }) {
  const projects = useProjects();
  const approve = useApproveIdea();
  const feedback = useIdeaFeedback();
  const changeStatus = useChangeIdeaStatus();

  const [open, setOpen] = useState(false);
  const [reply, setReply] = useState(idea.engineerFeedback ?? '');
  const [projectId, setProjectId] = useState(idea.projectId ?? '');
  const [pickedStageId, setPickedStageId] = useState<string>();

  const targetProjectId = projectId || projects.data?.[0]?.id;
  const project = useProject(targetProjectId);
  const stages = sortStages(project.data?.stages ?? []);
  const stageId = pickedStageId ?? getCurrentStage(stages)?.id ?? stages[0]?.id;
  const selectedStage = stages.find((s) => s.id === stageId);

  const underReview = idea.status === 'UNDER_REVIEW';
  const busy = approve.isPending || feedback.isPending || changeStatus.isPending;

  const convert = (withFeedback: boolean) => {
    if (!targetProjectId || !stageId) return;
    approve.mutate(
      {
        ideaId: idea.id,
        input: {
          stageId,
          projectId: idea.projectId ? undefined : targetProjectId,
          feedback: withFeedback && reply.trim() ? reply.trim() : undefined,
        },
      },
      { onSuccess: () => setOpen(false) },
    );
  };

  return (
    <div className="border-t border-zinc-100">
      <div className="flex flex-wrap items-center gap-2 px-5 py-3">
        {underReview && (
          <Button size="sm" icon={Zap} disabled={!selectedStage || busy} onClick={() => convert(false)}>
            Converter em task
            {selectedStage && (
              <span className="inline-flex items-center gap-1 font-normal text-zinc-400">
                <ArrowRight className="h-3 w-3" />
                {selectedStage.title}
              </span>
            )}
          </Button>
        )}
        <Button variant="secondary" size="sm" icon={MessageSquareText} onClick={() => setOpen((o) => !o)}>
          {open ? 'Fechar parecer' : idea.engineerFeedback ? 'Editar parecer' : 'Dar parecer'}
        </Button>

        <div className="ml-auto flex items-center gap-1">
          {(idea.status === 'UNDER_REVIEW' || idea.status === 'APPROVED') && (
            <Button
              variant="ghost"
              size="xs"
              icon={CheckCheck}
              disabled={busy}
              onClick={() => changeStatus.mutate({ ideaId: idea.id, input: { status: 'IMPLEMENTED' } })}
            >
              Implementada
            </Button>
          )}
          {underReview && (
            <Button
              variant="danger"
              size="xs"
              icon={Archive}
              disabled={busy}
              onClick={() => changeStatus.mutate({ ideaId: idea.id, input: { status: 'ARCHIVED' } })}
            >
              Arquivar
            </Button>
          )}
          {(idea.status === 'ARCHIVED' || idea.status === 'IMPLEMENTED') && (
            <Button
              variant="ghost"
              size="xs"
              icon={RotateCcw}
              disabled={busy}
              onClick={() => changeStatus.mutate({ ideaId: idea.id, input: { status: 'UNDER_REVIEW' } })}
            >
              Reabrir
            </Button>
          )}
        </div>
      </div>

      {open && (
        <div className="space-y-4 border-t border-dashed border-zinc-200 bg-zinc-50/50 px-5 py-4 animate-fade-in">
          <Field label="Parecer técnico" hint="Visível para o gestor">
            <textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              rows={3}
              placeholder="Viabilidade, esforço estimado, riscos e quando pode entrar…"
              className={inputClass}
            />
          </Field>

          {underReview && (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Projeto">
                <select
                  value={targetProjectId ?? ''}
                  disabled={Boolean(idea.projectId)}
                  onChange={(e) => {
                    setProjectId(e.target.value);
                    setPickedStageId(undefined);
                  }}
                  className={inputClass}
                >
                  {projects.data?.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Etapa de destino">
                <select
                  value={stageId ?? ''}
                  onChange={(e) => setPickedStageId(e.target.value)}
                  disabled={!stages.length}
                  className={inputClass}
                >
                  {!stages.length && <option value="">Projeto sem etapas</option>}
                  {stages.map((s, index) => (
                    <option key={s.id} value={s.id}>
                      {index + 1}. {s.title}
                      {s.status === 'ACTIVE' ? ' (atual)' : s.status === 'DONE' ? ' (concluída)' : ''}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          )}

          <div className="flex flex-wrap justify-end gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={reply.trim().length < 2 || busy}
              onClick={() => feedback.mutate({ ideaId: idea.id, feedback: reply.trim() })}
            >
              Salvar parecer
            </Button>
            {underReview && (
              <Button variant="success" size="sm" icon={Flag} disabled={!selectedStage || busy} onClick={() => convert(true)}>
                Aprovar e criar task
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
