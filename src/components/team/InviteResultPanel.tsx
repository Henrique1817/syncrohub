import { useState } from 'react';
import { AlertTriangle, Check, CheckCircle2, Copy, MailWarning } from 'lucide-react';
import { DEPARTMENT_META } from '../../lib/constants';
import { formatDate } from '../../lib/utils';
import type { InvitationResult } from '../../types';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { inputClass } from '../ui/Field';

function CopyLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="flex gap-2">
      <input readOnly value={url} onFocus={(e) => e.target.select()} className={`${inputClass} font-mono text-xs`} aria-label="Link do convite" />
      <Button variant="secondary" icon={copied ? Check : Copy} onClick={copy}>
        {copied ? 'Copiado' : 'Copiar'}
      </Button>
    </div>
  );
}

export function InviteResultPanel({ result, onClose }: { result: InvitationResult; onClose: () => void }) {
  const { member, invitation } = result;
  const department = member.department ? DEPARTMENT_META[member.department] : null;
  const sent = invitation.deliveryStatus === 'SENT';

  return (
    <div className="space-y-5 px-5 py-6">
      <div className="flex items-start gap-3">
        <span
          className={
            sent
              ? 'flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600'
              : 'flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600'
          }
        >
          {sent ? <CheckCircle2 className="h-5 w-5" /> : <MailWarning className="h-5 w-5" />}
        </span>
        <div>
          <h2 className="text-base font-semibold tracking-tight text-zinc-950">
            {sent ? `Convite enviado para ${member.name}` : `${member.name} foi cadastrado(a)`}
          </h2>
          <p className="mt-0.5 text-sm text-zinc-500">
            {sent
              ? `${member.email} recebeu o e-mail de boas-vindas${department ? ` de ${department.label}` : ''} com o link para criar a senha.`
              : 'O e-mail não pôde ser enviado. Copie o link abaixo e envie para a pessoa (WhatsApp, Teams, e-mail).'}
          </p>
        </div>
      </div>

      {department && (
        <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
          <Badge tone={department.tone} icon={department.icon}>
            {department.label}
          </Badge>
          <span>Link válido até {formatDate(invitation.expiresAt)}</span>
        </div>
      )}

      {invitation.deliveryStatus === 'NOT_CONFIGURED' && (
        <p className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          O envio de e-mail ainda não está configurado. Para os convites saírem automaticamente, defina RESEND_API_KEY no
          arquivo server/.env.
        </p>
      )}
      {invitation.deliveryStatus === 'FAILED' && (
        <p className="flex items-start gap-2 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Falha no envio: {invitation.deliveryError ?? 'erro desconhecido'}. Você pode reenviar o convite pela lista.
        </p>
      )}

      <div className="space-y-1.5">
        <p className="text-xs font-medium text-zinc-700">Link do convite</p>
        <CopyLink url={invitation.inviteUrl} />
        <p className="text-[11px] text-zinc-400">Por segurança, o link só aparece agora. Se perder, use "Reenviar convite".</p>
      </div>

      <div className="flex justify-end">
        <Button onClick={onClose}>Concluir</Button>
      </div>
    </div>
  );
}
