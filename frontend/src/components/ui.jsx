import { useRef, useState } from 'react';

/**
 * Bloqueia a acao enquanto a chamada de API esta em andamento (evita duplo
 * envio). O ref trava no mesmo tick; o state so serve para a UI reagir.
 */
export function useEnvio() {
  const [enviando, setEnviando] = useState(false);
  const travado = useRef(false);

  async function enviar(acao) {
    if (travado.current) return;
    travado.current = true;
    setEnviando(true);
    try {
      return await acao();
    } finally {
      travado.current = false;
      setEnviando(false);
    }
  }

  return [enviando, enviar];
}

export const LABEL_STATUS_NC = {
  aberta: 'Aberta',
  em_correcao: 'Em correcao',
  aguardando_validacao: 'Aguardando validacao',
  resolvida: 'Resolvida',
  atrasada: 'Atrasada',
};

const COR_STATUS_NC = {
  aberta: 'azul',
  em_correcao: 'amarelo',
  aguardando_validacao: 'roxo',
  resolvida: 'verde',
  atrasada: 'vermelho',
};

export const LABEL_RESPOSTA = {
  conforme: 'Conforme',
  nao_conforme: 'Nao conforme',
  nao_aplica: 'Nao se aplica',
};

const COR_SEVERIDADE = {
  baixa: 'cinza',
  media: 'azul',
  alta: 'amarelo',
  critica: 'vermelho',
};

export function StatusNcBadge({ status }) {
  return (
    <span className={`badge ${COR_STATUS_NC[status] || 'cinza'}`}>
      {LABEL_STATUS_NC[status] || status}
    </span>
  );
}

export function SeveridadeBadge({ severidade }) {
  return (
    <span className={`badge ${COR_SEVERIDADE[severidade] || 'cinza'}`}>
      {severidade}
    </span>
  );
}

export function AderenciaBadge({ valor }) {
  if (valor == null) return <span className="badge cinza">sem itens aplicaveis</span>;
  const cor = valor >= 90 ? 'verde' : valor >= 70 ? 'amarelo' : 'vermelho';
  return <span className={`badge ${cor}`}>{Number(valor).toFixed(2)}%</span>;
}

export function Erro({ children }) {
  if (!children) return null;
  return <div className="erro">{children}</div>;
}
