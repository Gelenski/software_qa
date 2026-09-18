import { transporter, remetente } from '../config/mailer.js';

/**
 * Envio de e-mail com fallback de teste: sem SMTP_HOST configurado, apenas
 * loga a mensagem no console (a POC continua demonstravel sem credenciais
 * reais). Pode lancar erro quando o transporte real falha - quem chama
 * (assinantes do eventBus) trata isso sem quebrar a operacao de negocio.
 */
export async function enviarEmail({ para, assunto, corpo }) {
  if (!transporter) {
    console.log(`[email-simulado] Para: ${para}\nAssunto: ${assunto}\n${corpo}\n`);
    return;
  }
  await transporter.sendMail({ from: remetente, to: para, subject: assunto, text: corpo });
}
