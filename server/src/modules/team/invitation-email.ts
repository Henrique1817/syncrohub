import type { Department } from '../../shared/domain/enums.js';
import { DEPARTMENT_LABEL } from '../../shared/domain/labels.js';

interface DepartmentContent {
  /** Por que o portal importa para este segmento. */
  focus: string;
  /** Exemplos de ideias que fazem sentido para o time. */
  ideaExamples: string[];
  /** Permissões a mais que o segmento recebe no portal. */
  extraCapabilities?: string[];
}

const BASE_CAPABILITIES = [
  'acompanhar os projetos e em que etapa cada um está;',
  'enviar ideias e sugestões de melhoria;',
  'comentar e ver o parecer técnico de cada sugestão.',
];

const DEPARTMENT_CONTENT: Record<Department, DepartmentContent> = {
  PURCHASING: {
    focus: 'Acompanhe os projetos que mudam a forma como compramos, cotamos e nos relacionamos com fornecedores.',
    ideaExamples: [
      'Automatizar cotações e a comparação entre fornecedores',
      'Alertas de estoque mínimo e sugestão de reposição',
      'Prazos de entrega dos fornecedores visíveis em um painel',
    ],
  },
  FINANCE: {
    focus: 'Acompanhe os projetos que dão mais controle e visibilidade sobre o caixa, as contas e os pagamentos.',
    ideaExamples: [
      'Conciliação bancária automática',
      'Fluxo de caixa atualizado em tempo real',
      'Aprovação digital de pagamentos, sem papel',
    ],
  },
  SALES: {
    focus: 'Acompanhe os projetos que ajudam o time comercial a vender mais e atender melhor os clientes.',
    ideaExamples: [
      'Pipeline de vendas e metas em um só lugar',
      'Tabela de preços sempre atualizada para a equipe',
      'Status do pedido visível para o cliente',
    ],
  },
  BILLING: {
    focus: 'Acompanhe os projetos que tornam o faturamento mais rápido, automático e sem retrabalho.',
    ideaExamples: [
      'Emissão automática de notas a partir do pedido',
      'Alertas de divergência entre pedido e faturamento',
      'Integração direta com o financeiro para cobrança',
    ],
  },
  TECHNOLOGY: {
    focus: 'Acompanhe o roadmap técnico de perto: etapas, entregas e o que vem a seguir em cada projeto.',
    ideaExamples: [
      'Integrações entre os sistemas que usamos hoje',
      'Monitoramento e alertas de falhas',
      'Automação de rotinas repetitivas',
    ],
  },
  MANAGEMENT: {
    focus: 'Tenha uma visão executiva de todos os projetos: em que etapa cada um está e o que foi entregue.',
    ideaExamples: [
      'Indicadores consolidados das áreas em um painel',
      'Priorização dos projetos de acordo com a estratégia',
      'Relatórios automáticos para reuniões de diretoria',
    ],
    extraCapabilities: ['convidar funcionários e gerenciar o acesso da equipe ao portal.'],
  },
};

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!);

interface InvitationEmailInput {
  name: string;
  department: Department;
  inviterName: string;
  inviteUrl: string;
  validForDays: number;
}

export function buildInvitationEmail({ name, department, inviterName, inviteUrl, validForDays }: InvitationEmailInput) {
  const firstName = name.trim().split(/\s+/)[0] ?? name;
  const segment = DEPARTMENT_LABEL[department];
  const { focus, ideaExamples, extraCapabilities = [] } = DEPARTMENT_CONTENT[department];
  const capabilities = [...BASE_CAPABILITIES, ...extraCapabilities];
  const subject = `${firstName}, seu acesso ao SyncroHub (${segment}) está pronto`;

  const text = [
    `Olá, ${firstName}!`,
    '',
    `${inviterName} convidou você para o SyncroHub, o portal onde acompanhamos os projetos de tecnologia da empresa.`,
    '',
    `${segment}: ${focus}`,
    '',
    'No portal você pode:',
    ...capabilities.map((item) => `- ${item}`),
    '',
    `Ideias que fazem diferença para ${segment}:`,
    ...ideaExamples.map((example) => `- ${example}`),
    '',
    `Ative seu acesso e crie sua senha: ${inviteUrl}`,
    `O link é válido por ${validForDays} dias.`,
  ].join('\n');

  const html = `<!doctype html>
<html lang="pt-BR">
  <body style="margin:0;background:#f4f4f5;font-family:Inter,Segoe UI,Arial,sans-serif;color:#18181b">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px">
      <tr><td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e4e4e7;border-radius:12px">
          <tr><td style="padding:28px 32px 8px">
            <p style="margin:0;font-size:13px;font-weight:600;color:#4f46e5">SyncroHub · ${escapeHtml(segment)}</p>
            <h1 style="margin:12px 0 0;font-size:22px;line-height:1.3">Olá, ${escapeHtml(firstName)}! Seu acesso está pronto.</h1>
            <p style="margin:12px 0 0;font-size:15px;line-height:1.6;color:#52525b">
              ${escapeHtml(inviterName)} convidou você para o SyncroHub, o portal onde acompanhamos os projetos de tecnologia da empresa.
            </p>
            <p style="margin:12px 0 0;font-size:15px;line-height:1.6;color:#52525b">${escapeHtml(focus)}</p>
          </td></tr>
          <tr><td style="padding:16px 32px 0">
            <p style="margin:0 0 8px;font-size:14px;font-weight:600">No portal você pode</p>
            <ul style="margin:0;padding-left:18px;font-size:14px;line-height:1.7;color:#52525b">
              ${capabilities.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}
            </ul>
          </td></tr>
          <tr><td style="padding:16px 32px 0">
            <div style="background:#f4f4f5;border-radius:8px;padding:14px 16px">
              <p style="margin:0 0 6px;font-size:13px;font-weight:600">Ideias que fazem diferença para ${escapeHtml(segment)}</p>
              <ul style="margin:0;padding-left:18px;font-size:13px;line-height:1.7;color:#52525b">
                ${ideaExamples.map((example) => `<li>${escapeHtml(example)}</li>`).join('')}
              </ul>
            </div>
          </td></tr>
          <tr><td style="padding:24px 32px 28px">
            <a href="${escapeHtml(inviteUrl)}" style="display:inline-block;background:#18181b;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 20px;border-radius:8px">Ativar meu acesso</a>
            <p style="margin:16px 0 0;font-size:12px;color:#a1a1aa">O link é válido por ${validForDays} dias. Se o botão não funcionar, copie e cole no navegador:<br>${escapeHtml(inviteUrl)}</p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;

  return { subject, html, text };
}
