import { useEffect, useState, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api/client.js';
import {
  StatusNcBadge,
  SeveridadeBadge,
  LABEL_RESPOSTA,
  Erro,
} from '../components/ui.jsx';

const OPCOES = ['conforme', 'nao_conforme', 'nao_aplica'];
const HOJE = new Date().toISOString().slice(0, 10);

function FormNc({ auditoriaId, item, responsaveis, aoCriar }) {
  const [form, setForm] = useState({
    descricao: '',
    severidade: 'media',
    responsavel: '',
    prazo: HOJE,
  });
  const [erro, setErro] = useState('');
  const set = (c) => (e) => setForm({ ...form, [c]: e.target.value });

  async function enviar(e) {
    e.preventDefault();
    setErro('');
    try {
      await api.criarNc({
        auditoriaId,
        checklistItemId: item.checklist_item_id,
        ...form,
      });
      setForm({ descricao: '', severidade: 'media', responsavel: '', prazo: HOJE });
      aoCriar();
    } catch (err) {
      setErro(err.message);
    }
  }

  if (responsaveis.length === 0) {
    return (
      <div
        className="erro"
        style={{ marginTop: 10 }}
      >
        Nenhum responsavel cadastrado. <Link to="/responsaveis">Cadastre um responsavel</Link>{' '}
        antes de criar a NC (o e-mail dele sera avisado de atribuicao, prazo proximo e
        vencimento).
      </div>
    );
  }

  return (
    <form
      onSubmit={enviar}
      style={{ marginTop: 10, background: '#fbf6f5', padding: 12, borderRadius: 6 }}
    >
      <strong>Nova nao conformidade</strong>
      <Erro>{erro}</Erro>
      <label>Descricao</label>
      <textarea rows={2} value={form.descricao} onChange={set('descricao')} />
      <div className="linha">
        <div>
          <label>Severidade</label>
          <select value={form.severidade} onChange={set('severidade')}>
            <option value="baixa">Baixa</option>
            <option value="media">Media</option>
            <option value="alta">Alta</option>
            <option value="critica">Critica</option>
          </select>
        </div>
        <div>
          <label>Responsavel</label>
          <select value={form.responsavel} onChange={set('responsavel')}>
            <option value="">Selecione...</option>
            {responsaveis.map((r) => (
              <option key={r.id} value={r.nome}>
                {r.nome}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label>Prazo</label>
          <input type="date" value={form.prazo} onChange={set('prazo')} />
          <small className="muted">Datas passadas sao aceitas (demonstrar atraso).</small>
        </div>
      </div>
      <div style={{ marginTop: 10 }}>
        <button type="submit" className="pequeno">
          Criar NC
        </button>
      </div>
    </form>
  );
}

export default function AuditRunPage() {
  const { id } = useParams();
  const [dados, setDados] = useState(null);
  const [erro, setErro] = useState('');
  const [msg, setMsg] = useState('');
  const [responsaveis, setResponsaveis] = useState([]);

  const carregar = useCallback(() => {
    api.obterAuditoria(id).then(setDados).catch((e) => setErro(e.message));
  }, [id]);
  useEffect(carregar, [carregar]);
  useEffect(() => {
    api.listarResponsaveis().then(setResponsaveis).catch(() => {});
  }, []);

  async function responder(itemId, resposta) {
    setErro('');
    try {
      const r = await api.responderItem(id, itemId, { resposta });
      setDados(r);
    } catch (err) {
      setErro(err.message);
    }
  }

  async function finalizar() {
    setErro('');
    setMsg('');
    try {
      const r = await api.finalizarAuditoria(id);
      setDados(r);
      setMsg('Auditoria finalizada.');
    } catch (err) {
      setErro(err.message);
    }
  }

  if (erro && !dados) return <Erro>{erro}</Erro>;
  if (!dados) return <p className="muted">Carregando...</p>;

  const { auditoria, itens, aderencia, progresso, naoConformidades } = dados;
  const finalizada = auditoria.status === 'finalizada';
  const ncPorItem = Object.fromEntries(
    naoConformidades.map((n) => [n.checklist_item_id, n]),
  );

  return (
    <>
      <p>
        <Link to="/auditorias">&larr; Auditorias</Link>
      </p>
      <div className="topo-acoes">
        <h2>
          Auditoria #{auditoria.id} &middot; {auditoria.caso_codigo}
        </h2>
        <span className={`badge ${finalizada ? 'verde' : 'azul'}`}>{auditoria.status}</span>
      </div>
      <p className="muted">
        {auditoria.caso_titulo} &middot; estrategia: {auditoria.estrategia}{' '}
        &middot; checklist: {auditoria.checklist_template_nome}
      </p>

      <Erro>{erro}</Erro>
      {msg && <div className="ok">{msg}</div>}

      <div className="card">
        <div className="linha">
          <div>
            <div className="rotulo muted">ADERENCIA</div>
            <div className="aderencia-num">
              {aderencia.percentual == null
                ? '--'
                : `${aderencia.percentual.toFixed(2)}%`}
            </div>
            <div className="muted">
              {aderencia.conformes} conformes / {aderencia.aplicaveis} aplicaveis
              {' '}(nao conformes: {aderencia.naoConformes}, N/A: {aderencia.naoAplica},
              {' '}nao respondidos: {aderencia.naoRespondidos})
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div className="muted">
              Progresso: {progresso.respondidos}/{progresso.total}
            </div>
            {!finalizada && (
              <button
                style={{ marginTop: 8 }}
                disabled={!auditoria.podeFinalizar}
                onClick={finalizar}
              >
                Finalizar auditoria
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Checklist</h3>
        {itens.map((it) => {
          const nc = ncPorItem[it.checklist_item_id];
          return (
            <div className="check-item" key={it.checklist_item_id}>
              <div className="pergunta">
                {it.ordem}. {it.pergunta}
              </div>
              <div className="opcoes">
                {OPCOES.map((op) => (
                  <label
                    key={op}
                    className={it.resposta === op ? `sel-${op}` : ''}
                  >
                    <input
                      type="radio"
                      name={`item-${it.checklist_item_id}`}
                      checked={it.resposta === op}
                      disabled={finalizada}
                      onChange={() => responder(it.checklist_item_id, op)}
                    />
                    {LABEL_RESPOSTA[op]}
                  </label>
                ))}
              </div>

              {it.resposta === 'nao_conforme' && !nc && (
                <FormNc
                  auditoriaId={auditoria.id}
                  item={it}
                  responsaveis={responsaveis}
                  aoCriar={() => {
                    setMsg('NC criada.');
                    carregar();
                  }}
                />
              )}
              {nc && (
                <div style={{ marginTop: 8 }}>
                  <StatusNcBadge status={nc.status} />{' '}
                  <SeveridadeBadge severidade={nc.severidade} />{' '}
                  <Link to={`/nao-conformidades/${nc.id}`}>
                    NC-{nc.id}: {nc.descricao.slice(0, 60)}
                    {nc.descricao.length > 60 ? '...' : ''}
                  </Link>{' '}
                  <span className="muted">
                    resp.: {nc.responsavel} &middot; prazo: {nc.prazo}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {naoConformidades.length > 0 && (
        <div className="card">
          <h3 style={{ marginTop: 0 }}>NCs desta auditoria</h3>
          <table>
            <thead>
              <tr>
                <th>NC</th>
                <th>Descricao</th>
                <th>Severidade</th>
                <th>Status</th>
                <th>Prazo</th>
              </tr>
            </thead>
            <tbody>
              {naoConformidades.map((n) => (
                <tr key={n.id}>
                  <td>
                    <Link to={`/nao-conformidades/${n.id}`}>NC-{n.id}</Link>
                  </td>
                  <td>{n.descricao}</td>
                  <td>
                    <SeveridadeBadge severidade={n.severidade} />
                  </td>
                  <td>
                    <StatusNcBadge status={n.status} />
                  </td>
                  <td>{n.prazo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
