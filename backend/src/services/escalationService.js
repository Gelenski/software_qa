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
 *
 * Reivindica o escalonamento com um UPDATE atomico (WHERE status NOT IN
 * ('resolvida','atrasada')) ANTES de publicar o evento: se duas chamadas
 * concorrentes (cron + botao manual, dois processos, duplo clique) tentarem
 * escalar a mesma NC, so a que ganhar a corrida no banco segue adiante -
 * a outra recebe `null` e nao registra nem envia e-mail duplicado.
 */
async function escalar(nc, hoje) {
  const diasAtraso = diasEntre(nc.prazo, hoje);
  const statusAnterior = nc.status;

  const reivindicado = await ncRepository.reivindicarEscalonamento(nc.id, {
    statusAnterior,
    escaladoEm: new Date().toISOString().slice(0, 19).replace('T', ' '),
  });
  if (!reivindicado) return null;

  const atualizada = await ncRepository.buscarPorId(nc.id);

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

// Trava em memoria: evita que o cron e um clique manual (ou dois ticks de
// cron sobrepostos) rodem a varredura completa em paralelo NO MESMO
// PROCESSO. A protecao real contra e-mail duplicado e o UPDATE atomico em
// reivindicarEscalonamento()/marcarAlertaPrazoEnviado() (funciona mesmo com
// dois processos Node concorrentes); esta trava so evita trabalho/ruido
// redundante quando a corrida acontece dentro de um unico processo.
let verificacaoEmAndamento = false;

export const escalationService = {
  /**
   * Varredura de prazos SOB DEMANDA (botao "Verificar prazos").
   * Sincrona e deterministica - ideal para demonstracao.
   */
  async verificarPrazos() {
    if (verificacaoEmAndamento) {
      return {
        dataReferencia: hojeISO(),
        verificadas: 0,
        escaladas: [],
        alertasProximoVencimento: [],
        ignorado: true,
      };
    }

    verificacaoEmAndamento = true;
    try {
      const hoje = hojeISO();
      const vencidas = await ncRepository.listarVencidasNaoEscaladas(hoje);
      const escaladas = [];
      for (const nc of vencidas) {
        const resultado = await escalar(nc, hoje);
        if (resultado) escaladas.push(resultado);
      }

      // Requisito adicional: aviso de "perto do vencimento" (nao vencidas ainda).
      const diasAlerta = Number(process.env.PRAZO_ALERTA_DIAS || 2);
      const limite = new Date(`${hoje}T00:00:00`);
      limite.setDate(limite.getDate() + diasAlerta);
      const limiteISO = limite.toISOString().slice(0, 10);

      const proximas = await ncRepository.listarProximasDoVencimento({ hoje, limite: limiteISO });
      const alertasProximoVencimento = [];
      for (const nc of proximas) {
        const diasRestantes = diasEntre(hoje, nc.prazo);
        // Reivindica ANTES de publicar: so quem ganhar o UPDATE atomico
        // envia o alerta, o que impede duplicidade entre execucoes
        // concorrentes (cron x botao manual, ou dois processos).
        const reivindicado = await ncRepository.marcarAlertaPrazoEnviado(nc.id);
        if (!reivindicado) continue;
        await eventBus.publish(EVENTOS.NC_PROXIMA_DO_VENCIMENTO, { nc, diasRestantes });
        alertasProximoVencimento.push({ id: nc.id, diasRestantes });
      }

      return {
        dataReferencia: hoje,
        verificadas: vencidas.length,
        escaladas,
        alertasProximoVencimento,
      };
    } finally {
      verificacaoEmAndamento = false;
    }
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
    const resultado = await escalar(nc, hoje);
    if (!resultado) {
      throw new AppError('NC ja foi escalonada por outra requisicao.', 409);
    }
    return resultado;
  },
};
