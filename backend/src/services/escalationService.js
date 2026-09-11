import { ncRepository } from '../repositories/ncRepository.js';
import { escalationRepository } from '../repositories/escalationRepository.js';
import { eventBus, EVENTOS } from '../domain/eventBus.js';
import { getEstado, STATUS } from '../domain/ncStatusMachine.js';
import { AppError, NotFoundError } from '../domain/errors.js';

function hojeISO() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

function diasEntre(dataInicioISO, dataFimISO) {
  const ms = new Date(dataFimISO) - new Date(dataInicioISO);
  return Math.max(0, Math.round(ms / 86_400_000));
}

/**
 * PUBLICADOR do padrao Observer.
 * Regra de negocio do requisito 5: quando uma NC ultrapassa o prazo e nao
 * esta resolvida -> marca "atrasada", registra o escalonamento e publica
 * o evento que dispara a notificacao.
 */
async function escalar(nc, hoje) {
  const diasAtraso = diasEntre(nc.prazo, hoje);

  // State: preserva de onde a NC veio para permitir a volta ao fluxo.
  const statusAnterior = nc.status;
  const atualizada = await ncRepository.atualizarStatus(nc.id, {
    status: STATUS.ATRASADA,
    statusAnterior,
    escaladoEm: new Date().toISOString().slice(0, 19).replace('T', ' '),
  });

  await escalationRepository.registrar({
    ncId: nc.id,
    motivo: `Prazo ${nc.prazo} ultrapassado; NC estava em "${statusAnterior}".`,
    prazoOriginal: nc.prazo,
    diasAtraso,
  });

  // Observer: notifica assinantes (NotificationService grava a notificacao).
  await eventBus.publish(EVENTOS.NC_ESCALADA, { nc: atualizada, diasAtraso });

  return { id: nc.id, statusAnterior, status: STATUS.ATRASADA, diasAtraso };
}

export const escalationService = {
  /**
   * Varredura de prazos SOB DEMANDA (botao "Verificar prazos").
   * Sincrona e deterministica - ideal para demonstracao.
   */
  async verificarPrazos() {
    const hoje = hojeISO();
    const vencidas = await ncRepository.listarVencidasNaoEscaladas(hoje);
    const escaladas = [];
    for (const nc of vencidas) {
      escaladas.push(await escalar(nc, hoje));
    }
    return {
      dataReferencia: hoje,
      verificadas: vencidas.length,
      escaladas,
    };
  },

  /** Escalonamento manual de UMA NC (botao "Escalonar" no detalhe). */
  async escalarUma(ncId) {
    const nc = await ncRepository.buscarPorId(ncId);
    if (!nc) throw new NotFoundError('Nao conformidade');

    if (!getEstado(nc.status).podeSerEscalada) {
      throw new AppError(
        `NC com status "${nc.status}" nao pode ser escalada.`,
        409,
      );
    }
    const hoje = hojeISO();
    if (nc.prazo >= hoje) {
      throw new AppError(
        `A NC ainda esta dentro do prazo (${nc.prazo}). So e possivel escalar apos o vencimento.`,
      );
    }
    return escalar(nc, hoje);
  },

  listarEscalonamentos(ncId) {
    return escalationRepository.listarPorNc(ncId);
  },
};
