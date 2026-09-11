import { auditRepository } from '../repositories/auditRepository.js';
import { checklistRepository } from '../repositories/checklistRepository.js';
import { testCaseRepository } from '../repositories/testCaseRepository.js';
import { ncRepository } from '../repositories/ncRepository.js';
import { AppError, NotFoundError } from '../domain/errors.js';
import {
  getAderenciaStrategy,
  ESTRATEGIAS_DISPONIVEIS,
} from '../domain/adherenceStrategy.js';

const RESPOSTAS_VALIDAS = ['conforme', 'nao_conforme', 'nao_aplica'];

export const auditService = {
  /** Inicia uma auditoria para um caso de teste, criando as respostas em branco. */
  async iniciar({ casoTesteId, estrategia = 'padrao' }) {
    if (!casoTesteId) throw new AppError('Informe o caso de teste.');
    if (!ESTRATEGIAS_DISPONIVEIS.includes(estrategia)) {
      throw new AppError(
        `Estrategia invalida. Use uma de: ${ESTRATEGIAS_DISPONIVEIS.join(', ')}.`,
      );
    }

    const caso = await testCaseRepository.buscarPorId(casoTesteId);
    if (!caso) throw new NotFoundError('Caso de teste');

    const itens = await checklistRepository.listarAtivos();
    if (itens.length === 0) throw new AppError('Checklist nao configurado.');

    const auditoriaId = await auditRepository.criar({ casoTesteId, estrategia });
    await auditRepository.criarItens(auditoriaId, itens.map((i) => i.id));

    return this.obter(auditoriaId);
  },

  listar() {
    return auditRepository.listar();
  },

  /** Visao completa: auditoria + itens + aderencia calculada + NCs. */
  async obter(id) {
    const auditoria = await auditRepository.buscarPorId(id);
    if (!auditoria) throw new NotFoundError('Auditoria');

    const itens = await auditRepository.listarItens(id);
    const naoConformidades = await ncRepository.listar({ auditoriaId: id });
    const aderencia = this._calcular(auditoria.estrategia, itens);
    const totalRespondidos = itens.filter((i) => i.resposta != null).length;

    return {
      auditoria: {
        ...auditoria,
        podeFinalizar:
          auditoria.status === 'em_andamento' && totalRespondidos === itens.length,
      },
      itens,
      aderencia,
      progresso: { respondidos: totalRespondidos, total: itens.length },
      naoConformidades,
    };
  },

  async responderItem(auditoriaId, checklistItemId, { resposta, observacao }) {
    const auditoria = await auditRepository.buscarPorId(auditoriaId);
    if (!auditoria) throw new NotFoundError('Auditoria');
    if (auditoria.status === 'finalizada') {
      throw new AppError('Auditoria finalizada nao pode ser alterada.', 409);
    }
    // resposta null = "voltar para nao respondido"
    if (resposta != null && !RESPOSTAS_VALIDAS.includes(resposta)) {
      throw new AppError(
        `Resposta invalida. Use: ${RESPOSTAS_VALIDAS.join(', ')} (ou nulo).`,
      );
    }

    const ok = await auditRepository.atualizarResposta(auditoriaId, checklistItemId, {
      resposta: resposta ?? null,
      observacao,
    });
    if (!ok) throw new NotFoundError('Item do checklist nesta auditoria');

    // Recalcula e persiste a aderencia parcial (snapshot vivo).
    const itens = await auditRepository.listarItens(auditoriaId);
    const aderencia = this._calcular(auditoria.estrategia, itens);
    await auditRepository.atualizarAderencia(auditoriaId, aderencia.percentual);

    return this.obter(auditoriaId);
  },

  async finalizar(id) {
    const auditoria = await auditRepository.buscarPorId(id);
    if (!auditoria) throw new NotFoundError('Auditoria');
    if (auditoria.status === 'finalizada') {
      throw new AppError('Auditoria ja finalizada.', 409);
    }

    const itens = await auditRepository.listarItens(id);
    const pendentes = itens.filter((i) => i.resposta == null);
    if (pendentes.length > 0) {
      throw new AppError(
        `Responda todos os itens antes de finalizar. Pendentes: ${pendentes.length}.`,
      );
    }

    const aderencia = this._calcular(auditoria.estrategia, itens);
    await auditRepository.finalizar(id, aderencia.percentual);
    return this.obter(id);
  },

  _calcular(estrategiaNome, itens) {
    const strategy = getAderenciaStrategy(estrategiaNome);
    return strategy.calcular(itens.map((i) => ({ resposta: i.resposta })));
  },
};
