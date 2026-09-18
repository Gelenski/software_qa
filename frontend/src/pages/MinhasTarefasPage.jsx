import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import { getSessao } from '../auth.js';
import { StatusNcBadge, SeveridadeBadge, Erro } from '../components/ui.jsx';

export default function MinhasTarefasPage() {
  const [ncs, setNcs] = useState([]);
  const [erro, setErro] = useState('');
  const sessao = getSessao();

  useEffect(() => {
    api.listarNc({ responsavel: sessao.nome }).then(setNcs).catch((e) => setErro(e.message));
  }, [sessao.nome]);

  return (
    <>
      <h2>Minhas tarefas</h2>
      <p className="muted">Nao conformidades atribuidas a {sessao.nome}.</p>

      <Erro>{erro}</Erro>

      <table>
        <thead>
          <tr>
            <th>NC</th>
            <th>Caso</th>
            <th>Descricao</th>
            <th>Severidade</th>
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
              <td>{n.prazo}</td>
              <td>
                <StatusNcBadge status={n.status} />
              </td>
            </tr>
          ))}
          {ncs.length === 0 && (
            <tr>
              <td colSpan={6} className="muted">
                Nenhuma tarefa atribuida.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </>
  );
}
