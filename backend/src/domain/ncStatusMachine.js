/**
 * PADRAO DE PROJETO: State
 * -----------------------------------------------------------------------------
 * O ciclo de vida da Nao Conformidade e uma maquina de estados. Cada estado e
 * uma classe que sabe:
 *   - para quais estados pode transicionar (transicao MANUAL, feita pelo usuario);
 *   - se e um estado final;
 *   - se permite ser escalado (transicao AUTOMATICA para 'atrasada').
 *
 * "atrasada" nunca e destino de transicao manual - so o EscalationService
 * (varredura de prazos) coloca a NC nesse estado.
 */

export const STATUS = Object.freeze({
  ABERTA: 'aberta',
  EM_CORRECAO: 'em_correcao',
  AGUARDANDO_VALIDACAO: 'aguardando_validacao',
  RESOLVIDA: 'resolvida',
  ATRASADA: 'atrasada',
});

class EstadoNC {
  get nome() {
    throw new Error('abstrato');
  }
  /** Estados alcancaveis por acao manual do usuario. */
  get transicoesManuais() {
    return [];
  }
  get ehFinal() {
    return false;
  }
  /** A varredura de prazos pode escalar esta NC? */
  get podeSerEscalada() {
    return !this.ehFinal && this.nome !== STATUS.ATRASADA;
  }
  permiteTransicaoManual(destino) {
    return this.transicoesManuais.includes(destino);
  }
}

class Aberta extends EstadoNC {
  get nome() {
    return STATUS.ABERTA;
  }
  get transicoesManuais() {
    return [STATUS.EM_CORRECAO, STATUS.AGUARDANDO_VALIDACAO];
  }
}

class EmCorrecao extends EstadoNC {
  get nome() {
    return STATUS.EM_CORRECAO;
  }
  get transicoesManuais() {
    return [STATUS.ABERTA, STATUS.AGUARDANDO_VALIDACAO];
  }
}

class AguardandoValidacao extends EstadoNC {
  get nome() {
    return STATUS.AGUARDANDO_VALIDACAO;
  }
  get transicoesManuais() {
    return [STATUS.EM_CORRECAO, STATUS.RESOLVIDA];
  }
}

class Resolvida extends EstadoNC {
  get nome() {
    return STATUS.RESOLVIDA;
  }
  get transicoesManuais() {
    return [STATUS.ABERTA]; // permite reabrir
  }
  get ehFinal() {
    return true;
  }
}

class Atrasada extends EstadoNC {
  get nome() {
    return STATUS.ATRASADA;
  }
  // Recuperacao: uma NC atrasada volta ao fluxo normal ou e resolvida.
  get transicoesManuais() {
    return [STATUS.EM_CORRECAO, STATUS.AGUARDANDO_VALIDACAO, STATUS.RESOLVIDA];
  }
}

const ESTADOS = {
  [STATUS.ABERTA]: new Aberta(),
  [STATUS.EM_CORRECAO]: new EmCorrecao(),
  [STATUS.AGUARDANDO_VALIDACAO]: new AguardandoValidacao(),
  [STATUS.RESOLVIDA]: new Resolvida(),
  [STATUS.ATRASADA]: new Atrasada(),
};

export function getEstado(nome) {
  const estado = ESTADOS[nome];
  if (!estado) throw new Error(`Status desconhecido: ${nome}`);
  return estado;
}

/**
 * Valida uma transicao manual. Lanca Error com mensagem amigavel se invalida.
 * @returns {string} o status de destino (normalizado)
 */
export function validarTransicaoManual(atual, destino) {
  const estadoAtual = getEstado(atual);
  if (destino === STATUS.ATRASADA) {
    throw new Error(
      'O status "atrasada" e definido automaticamente pela verificacao de prazos, nao manualmente.',
    );
  }
  if (atual === destino) {
    throw new Error(`A NC ja esta com status "${destino}".`);
  }
  if (!estadoAtual.permiteTransicaoManual(destino)) {
    const opcoes = estadoAtual.transicoesManuais.join(', ') || 'nenhuma';
    throw new Error(
      `Transicao invalida: de "${atual}" para "${destino}". Transicoes permitidas: ${opcoes}.`,
    );
  }
  return destino;
}

/** Transicoes manuais possiveis a partir do status atual (para a UI). */
export function transicoesPossiveis(atual) {
  return getEstado(atual).transicoesManuais;
}
