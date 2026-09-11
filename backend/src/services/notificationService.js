import { eventBus, EVENTOS } from '../domain/eventBus.js';
import { notificationRepository } from '../repositories/notificationRepository.js';

/**
 * ASSINANTE do padrao Observer.
 * Reage ao evento "nc.escalada" gravando uma notificacao SIMULADA
 * (sem envio real de e-mail) para o responsavel e para o lider.
 */
function formatarMensagem({ nc, diasAtraso, lider }) {
  return [
    `A nao conformidade NC-${nc.id} ultrapassou o prazo (${nc.prazo}) ` +
      `e esta atrasada ha ${diasAtraso} dia(s).`,
    `Caso de teste: ${nc.caso_codigo ?? nc.auditoria_id}.`,
    `Severidade: ${nc.severidade}.`,
    `Responsavel: ${nc.responsavel}. Lider acionado: ${lider}.`,
    `Acao esperada: tratar a NC e mover para "aguardando_validacao" / "resolvida".`,
  ].join(' ');
}

async function aoEscalar({ nc, diasAtraso }) {
  const lider = 'Lider de QA';
  const assunto = `[Escalonamento] NC-${nc.id} atrasada (${diasAtraso} dia(s))`;
  const mensagem = formatarMensagem({ nc, diasAtraso, lider });

  await notificationRepository.criar({
    ncId: nc.id,
    destinatario: nc.responsavel,
    assunto,
    mensagem,
  });
  await notificationRepository.criar({
    ncId: nc.id,
    destinatario: lider,
    assunto,
    mensagem,
  });
}

/** Chamado uma vez no bootstrap para registrar o assinante. */
export function registrarAssinantesDeNotificacao() {
  eventBus.subscribe(EVENTOS.NC_ESCALADA, aoEscalar);
}

export const notificationService = {
  listar(filtro) {
    return notificationRepository.listar(filtro);
  },
};
