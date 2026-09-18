import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import {
  StatusNcBadge,
  SeveridadeBadge,
  LABEL_STATUS_NC,
  Erro,
  useEnvio,
} from '../components/ui.jsx';

export default function NcListPage() {
  const [ncs, setNcs] = useState([]);
  const [filtro, setFiltro] = useState('');
  const [erro, setErro] = useState('');
  const [resultado, setResultado] = useState(null);
  const [enviando, enviar] = useEnvio();

  function carregar() {
    return api.listarNc({ status: filtro }).then(setNcs).catch((e) => setErro(e.message));
  }
  useEffect(() => {
    carregar();
  }, [filtro]);

  function verificarPrazos() {
    return enviar(async () => {
      setErro('');
      setResultado(null);
      try {
        const r = await api.verificarPrazos();
        setResultado(r);
        await carregar();
      } catch (err) {
        setErro(err.message);
      }
    });
  }

  return (
    <>
      <div className="topo-acoes">
        <h2>Nao conformidades</h2>
        <button onClick={verificarPrazos} disabled={enviando}>
          {enviando ? 'Verificando...' : 'Verificar prazos'}
        </button>
      </div>

      <Erro>{erro}</Erro>

      {resultado && (
        <div className={resultado.escaladas.length ? 'erro' : 'ok'}>
          Verificacao em {resultado.dataReferencia}: {resultado.verificadas} NC(s) vencida(s),{' '}
          {resultado.escaladas.length} escalonada(s)
          {resultado.escaladas.length > 0 &&
            ` (NC ${resultado.escaladas.map((e) => e.id).join(', ')} -> atrasada)`}
          .
        </div>
      )}

      <div className="card">
        <label>Filtrar por status</label>
        <select
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          style={{ maxWidth: 260 }}
        >
          <option value="">Todos</option>
          {Object.entries(LABEL_STATUS_NC).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      </div>

      <table>
        <thead>
          <tr>
            <th>NC</th>
            <th>Caso</th>
            <th>Descricao</th>
            <th>Severidade</th>
            <th>Responsavel</th>
            <th>Prazo</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {ncs.map((n) => (
            <tr key={n.id}>
              <td>
                <Link to={`/nao-conformidades/${n.id}`}>NC-{n.id}</Link>
              </td>
              <td>{n.caso_codigo}</td>
              <td>{n.descricao}</td>
              <td>
                <SeveridadeBadge severidade={n.severidade} />
              </td>
              <td>{n.responsavel}</td>
              <td>{n.prazo}</td>
              <td>
                <StatusNcBadge status={n.status} />
              </td>
            </tr>
          ))}
          {ncs.length === 0 && (
            <tr>
              <td colSpan={7} className="muted">
                Nenhuma NC.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </>
  );
}
