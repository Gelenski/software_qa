import { ncRepository } from '../repositories/ncRepository.js';
import { auditRepository } from '../repositories/auditRepository.js';
import { escalationRepository } from '../repositories/escalationRepository.js';
import { notificationRepository } from '../repositories/notificationRepository.js';
import { eventBus, EVENTOS } from '../domain/eventBus.js';
import { AppError, NotFoundError } from '../domain/errors.js';
import {
  validarTransicaoManual,
  transicoesPossiveis,
} from '../domain/ncStatusMachine.js';

const SEVERIDADES = ['baixa', 'media', 'alta', 'critica'];
const DATA_RE = /^\d{4}-\d{2}-\d{2}$/;

export const ncService = {
  async criar(body) {
    const auditoriaId = Number(body.auditoriaId);
    const descricao = (body.descricao || '').trim();
    const responsavel = (body.responsavel || '').trim();
    const severidade = body.severidade || 'media';
    const prazo = (body.prazo || '').trim();
    const checklistItemId = body.checklistItemId ? Number(body.checklistItemId) : null;

    if (!auditoriaId) throw new AppError('Informe a auditoria de origem.');
    if (!descricao) throw new AppError('Descreva a nao conformidade.');
    if (!responsavel) throw new AppError('Informe o responsavel.');
    if (!SEVERIDADES.includes(severidade)) {
      throw new AppError(`Severidade invalida. Use: ${SEVERIDADES.join(', ')}.`);
    }
    if (!DATA_RE.test(prazo)) {
      throw new AppError('Informe o prazo no formato AAAA-MM-DD.');
    }
    // Observacao: prazos no passado SAO permitidos (necessario p/ demonstrar atraso).

    const auditoria = await auditRepository.buscarPorId(auditoriaId);
    if (!auditoria) throw new NotFoundError('Auditoria');

    // Requisito 4: a NC nasce de um item marcado como "nao conforme".
    if (checklistItemId != null) {
      const itens = await auditRepository.listarItens(auditoriaId);
      const item = itens.find((i) => i.checklist_item_id === checklistItemId);
      if (!item) throw new NotFoundError('Item do checklist nesta auditoria');
      if (item.resposta !== 'nao_conforme') {
        throw new AppError(
          'So e possivel abrir NC para itens marcados como "nao conforme".',
          409,
        );
      }
    }

    const nc = await ncRepository.criar({
      auditoriaId,
      checklistItemId,
      descricao,
      severidade,
      responsavel,
      prazo,
    });

    // Observer: publica a atribuicao para quem quiser reagir (e-mail real).
    await eventBus.publish(EVENTOS.NC_ATRIBUIDA, { nc });

    return nc;
  },

  listar(filtro) {
    return ncRepository.listar(filtro);
  },

  async obter(id) {
    const nc = await ncRepository.buscarPorId(id);
    if (!nc) throw new NotFoundError('Nao conformidade');
    const [escalonamentos, notificacoes] = await Promise.all([
      escalationRepository.listarPorNc(id),
      notificationRepository.listar({ ncId: id }),
    ]);
    return {
      ...nc,
      transicoesPermitidas: transicoesPossiveis(nc.status),
      escalonamentos,
      notificacoes,
    };
  },

  /** Transicao de status validada pela maquina de estados (padrao State). */
  async alterarStatus(id, novoStatus) {
    const nc = await ncRepository.buscarPorId(id);
    if (!nc) throw new NotFoundError('Nao conformidade');

    let destino;
    try {
      destino = validarTransicaoManual(nc.status, novoStatus);
    } catch (err) {
      throw new AppError(err.message, 409);
    }

    await ncRepository.atualizarStatus(id, {
      status: destino,
      statusAnterior: nc.status,
    });
    return this.obter(id);
  },
};
