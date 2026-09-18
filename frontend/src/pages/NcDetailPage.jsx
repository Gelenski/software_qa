import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api/client.js';
import {
  StatusNcBadge,
  SeveridadeBadge,
  LABEL_STATUS_NC,
  Erro,
  useEnvio,
} from '../components/ui.jsx';

export default function NcDetailPage() {
  const { id } = useParams();
  const [nc, setNc] = useState(null);
  const [erro, setErro] = useState('');
  const [msg, setMsg] = useState('');
  const [enviando, enviar] = useEnvio();

  const carregar = useCallback(() => {
    return api.obterNc(id).then(setNc).catch((e) => setErro(e.message));
  }, [id]);
  useEffect(() => {
    carregar();
  }, [carregar]);

  function mudarStatus(status) {
    return enviar(async () => {
      setErro('');
      setMsg('');
      try {
        await api.alterarStatusNc(id, status);
        setMsg(`Status alterado para "${LABEL_STATUS_NC[status]}".`);
        await carregar();
      } catch (err) {
        setErro(err.message);
      }
    });
  }

  function escalar() {
    return enviar(async () => {
      setErro('');
      setMsg('');
      try {
        await api.escalarNc(id);
        setMsg('NC escalonada.');
        await carregar();
      } catch (err) {
        setErro(err.message);
      }
    });
  }

  if (erro && !nc) return <Erro>{erro}</Erro>;
  if (!nc) return <p className="muted">Carregando...</p>;

  const vencida = nc.prazo < new Date().toISOString().slice(0, 10);

  return (
    <>
      <p>
        <Link to="/nao-conformidades">&larr; Nao conformidades</Link>
      </p>
      <div className="topo-acoes">
        <h2>NC-{nc.id}</h2>
        <StatusNcBadge status={nc.status} />
      </div>

      <Erro>{erro}</Erro>
      {msg && <div className="ok">{msg}</div>}

      <div className="card">
        <p style={{ whiteSpace: 'pre-wrap', marginTop: 0 }}>{nc.descricao}</p>
        <div className="linha">
          <div>
            <label>Severidade</label>
            <SeveridadeBadge severidade={nc.severidade} />
          </div>
          <div>
            <label>Responsavel</label>
            {nc.responsavel}
          </div>
          <div>
            <label>Prazo</label>
            {nc.prazo} {vencida && <span className="badge vermelho">vencido</span>}
          </div>
          <div>
            <label>Item do checklist</label>
            {nc.checklist_pergunta || '-'}
          </div>
        </div>
        <div className="linha" style={{ marginTop: 8 }}>
          <div>
            <label>Auditoria</label>
            <Link to={`/auditorias/${nc.auditoria_id}`}>#{nc.auditoria_id}</Link> ({nc.caso_codigo})
          </div>
          <div>
            <label>Status anterior</label>
            {nc.status_anterior || '-'}
          </div>
          <div>
            <label>Escalado em</label>
            {nc.escalado_em || '-'}
          </div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Acoes</h3>
        <p className="muted">
          Transicoes permitidas a partir de "{LABEL_STATUS_NC[nc.status]}":
        </p>
        <div className="opcoes">
          {nc.transicoesPermitidas.length === 0 && (
            <span className="muted">Nenhuma (estado final).</span>
          )}
          {nc.transicoesPermitidas.map((s) => (
            <button
              key={s}
              className="pequeno"
              disabled={enviando}
              onClick={() => mudarStatus(s)}
            >
              {LABEL_STATUS_NC[s]}
            </button>
          ))}
        </div>

        {nc.status !== 'atrasada' && nc.status !== 'resolvida' && (
          <div style={{ marginTop: 14 }}>
            <button className="perigo pequeno" onClick={escalar} disabled={!vencida || enviando}>
              {enviando ? 'Enviando...' : 'Escalonar NC'}
            </button>{' '}
            <span className="muted">
              {vencida
                ? 'Marca como atrasada, registra o escalonamento e notifica.'
                : 'Disponivel apenas apos o vencimento do prazo.'}
            </span>
          </div>
        )}
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Escalonamentos</h3>
        {nc.escalonamentos.length === 0 && (
          <p className="muted">Nenhum escalonamento registrado.</p>
        )}
        <ul className="timeline">
          {nc.escalonamentos.map((e) => (
            <li key={e.id}>
              <strong>{e.criado_em}</strong> &middot; {e.dias_atraso} dia(s) de atraso
              <br />
              <span className="muted">{e.motivo}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Notificacoes</h3>
        {nc.notificacoes.length === 0 && (
          <p className="muted">Nenhuma notificacao.</p>
        )}
        {nc.notificacoes.map((n) => (
          <div className="notif" key={n.id}>
            <div className="assunto">{n.assunto}</div>
            <div className="muted">
              Para: {n.destinatario} &middot; canal: {n.canal} &middot; {n.criado_em}
            </div>
            <div style={{ marginTop: 4 }}>{n.mensagem}</div>
          </div>
        ))}
      </div>
    </>
  );
}
