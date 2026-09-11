/**
 * PADRAO DE PROJETO: Strategy
 * -----------------------------------------------------------------------------
 * O calculo de aderencia pode seguir criterios diferentes de auditoria.
 * Cada criterio e uma estrategia intercambiavel; o AuditService escolhe uma
 * em tempo de execucao a partir do campo `auditoria.estrategia`.
 *
 *   Aderencia = itens conformes / itens aplicaveis x 100
 *
 * - "padrao":  itens nao respondidos NAO entram no calculo (denominador).
 * - "estrita": itens nao respondidos contam como NAO CONFORME.
 */

/** @typedef {{resposta: 'conforme'|'nao_conforme'|'nao_aplica'|null}} Resposta */

class AderenciaStrategy {
  /** @param {Resposta[]} _respostas */
  calcular(_respostas) {
    throw new Error('Strategy nao implementada');
  }
}

function resumoBase(respostas) {
  const total = respostas.length;
  const conformes = respostas.filter((r) => r.resposta === 'conforme').length;
  const naoConformes = respostas.filter((r) => r.resposta === 'nao_conforme').length;
  const naoAplica = respostas.filter((r) => r.resposta === 'nao_aplica').length;
  const naoRespondidos = respostas.filter((r) => r.resposta == null).length;
  return { total, conformes, naoConformes, naoAplica, naoRespondidos };
}

function montarResultado({ conformes, aplicaveis, base, estrategia }) {
  const percentual =
    aplicaveis === 0 ? null : Math.round((conformes / aplicaveis) * 10000) / 100;
  return {
    estrategia,
    percentual,                 // null quando nao ha itens aplicaveis
    conformes,
    aplicaveis,
    naoConformes: base.naoConformes,
    naoAplica: base.naoAplica,
    naoRespondidos: base.naoRespondidos,
    total: base.total,
  };
}

export class AderenciaPadrao extends AderenciaStrategy {
  static nome = 'padrao';
  calcular(respostas) {
    const base = resumoBase(respostas);
    const aplicaveis = base.conformes + base.naoConformes; // exclui N/A e nao respondidos
    return montarResultado({
      conformes: base.conformes,
      aplicaveis,
      base,
      estrategia: AderenciaPadrao.nome,
    });
  }
}

export class AderenciaEstrita extends AderenciaStrategy {
  static nome = 'estrita';
  calcular(respostas) {
    const base = resumoBase(respostas);
    const aplicaveis = base.total - base.naoAplica; // nao respondidos entram como aplicaveis
    return montarResultado({
      conformes: base.conformes,
      aplicaveis,
      base,
      estrategia: AderenciaEstrita.nome,
    });
  }
}

const REGISTRO = {
  [AderenciaPadrao.nome]: new AderenciaPadrao(),
  [AderenciaEstrita.nome]: new AderenciaEstrita(),
};

/** Factory Method simples: resolve a estrategia pelo nome (default: padrao). */
export function getAderenciaStrategy(nome) {
  return REGISTRO[nome] || REGISTRO[AderenciaPadrao.nome];
}

export const ESTRATEGIAS_DISPONIVEIS = Object.keys(REGISTRO);
