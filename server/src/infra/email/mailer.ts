/* Arquivo de configuração do envio de e-mails.
   sendEmail: Envia um e-mail usando o Resend.
   isEmailConfigured: Verifica se o Resend está configurado.
*/

import { Resend } from 'resend';
import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

export type DeliveryResult =
  | { status: 'SENT' }
  | { status: 'NOT_CONFIGURED' }
  | { status: 'FAILED'; error: string };

export interface OutgoingEmail {
  to: string;
  subject: string;
  html: string;
  text: string;
  /** Formato `<evento>/<id>`: evita e-mail duplicado se a mesma chamada for repetida (válido por 24h). */
  idempotencyKey: string;
}

export function isEmailConfigured() {
  return resend !== null;
}

/** Nunca lança: o resultado é gravado no convite para o engenheiro ver e reenviar. */
export async function sendEmail(email: OutgoingEmail): Promise<DeliveryResult> {
  if (!resend) {
    logger.warn({ to: email.to, subject: email.subject }, 'RESEND_API_KEY ausente: e-mail não enviado');
    return { status: 'NOT_CONFIGURED' };
  }

  try {
    // O SDK do Resend devolve { data, error } em vez de lançar para erros da API.
    const { error } = await resend.emails.send(
      { from: env.EMAIL_FROM, to: [email.to], subject: email.subject, html: email.html, text: email.text },
      { idempotencyKey: email.idempotencyKey },
    );
    if (error) {
      logger.error({ to: email.to, err: error }, 'Falha ao enviar e-mail');
      return { status: 'FAILED', error: error.message };
    }
    return { status: 'SENT' };
  } catch (err) {
    logger.error({ to: email.to, err }, 'Erro de rede ao enviar e-mail');
    return { status: 'FAILED', error: 'Não foi possível contatar o provedor de e-mail.' };
  }
}
