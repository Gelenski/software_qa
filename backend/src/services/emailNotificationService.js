import { eventBus, EVENTOS } from '../domain/eventBus.js';
import { responsavelRepository } from '../repositories/responsavelRepository.js';
import { notificationRepository } from '../repositories/notificationRepository.js';
import { enviarEmail } from './mailService.js';
import { transporter } from '../config/mailer.js';

/**
 * ASSINANTE do padrao Observer, dedicado ao envio de e-mail real (separado
 * de notificationService.js, que so grava/le o historico simulado). Reage a
 * atribuicao, prazo proximo do vencimento e escalonamento, resolvendo o
 * e-mail do responsavel pelo cadastro de `responsaveis`.
 */
async function enviarParaResponsavel({ nc, assunto, mensagem }) {
  const resp = await responsavelRepository.buscarPorNome(nc.responsavel);
  if (!resp) {
    console.warn(
      `[email] responsavel "${nc.responsavel}" nao cadastrado em responsaveis; ` +
        `e-mail nao enviado (NC-${nc.id}).`,
    );
    return;
  }

  await enviarEmail({ para: resp.email, assunto, corpo: mensagem });
  await notificationRepository.criar({
    ncId: nc.id,
    destinatario: resp.email,
    assunto,
    mensagem,
    canal: transporter ? 'email' : 'email_simulado',
  });
}

async function aoEscalar({ nc, diasAtraso }) {
  const assunto = `[Escalonamento] NC-${nc.id} atrasada (${diasAtraso} dia(s))`;
  const mensagem =
    `A NC-${nc.id} (${nc.descricao}) do caso ${nc.caso_codigo} ultrapassou o prazo ` +
    `(${nc.prazo}) e esta atrasada ha ${diasAtraso} dia(s). Severidade: ${nc.severidade}.`;

  await enviarParaResponsavel({ nc, assunto, mensagem });

  const emailLider = process.env.EMAIL_LIDER;
  if (emailLider) {
    await enviarEmail({ para: emailLider, assunto, corpo: mensagem });
    await notificationRepository.criar({
      ncId: nc.id,
      destinatario: emailLider,
      assunto,
      mensagem,
      canal: transporter ? 'email' : 'email_simulado',
    });
  }
}

async function aoAtribuir({ nc }) {
  await enviarParaResponsavel({
    nc,
    assunto: `[Nova NC] NC-${nc.id} atribuida a voce`,
    mensagem:
      `Voce foi designado(a) responsavel pela NC-${nc.id} (${nc.descricao}) do caso ` +
      `${nc.caso_codigo}. Severidade: ${nc.severidade}. Prazo: ${nc.prazo}.`,
  });
}

async function aoAproximarVencimento({ nc, diasRestantes }) {
  const prazoTexto = diasRestantes <= 0 ? 'vence hoje' : `vence em ${diasRestantes} dia(s)`;
  await enviarParaResponsavel({
    nc,
    assunto: `[Alerta de prazo] NC-${nc.id} ${prazoTexto}`,
    mensagem:
      `A NC-${nc.id} (${nc.descricao}) do caso ${nc.caso_codigo} ${prazoTexto} ` +
      `(prazo: ${nc.prazo}). Trate antes do vencimento para evitar escalonamento.`,
  });
}

/** Chamado uma vez no bootstrap para registrar os assinantes. */
export function registrarAssinantesDeEmail() {
  eventBus.subscribe(EVENTOS.NC_ESCALADA, aoEscalar);
  eventBus.subscribe(EVENTOS.NC_ATRIBUIDA, aoAtribuir);
  eventBus.subscribe(EVENTOS.NC_PROXIMA_DO_VENCIMENTO, aoAproximarVencimento);
}
