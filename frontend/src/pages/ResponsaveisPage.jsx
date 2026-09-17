import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { Erro } from '../components/ui.jsx';

const VAZIO = { nome: '', email: '' };

export default function ResponsaveisPage() {
  const [responsaveis, setResponsaveis] = useState([]);
  const [form, setForm] = useState(VAZIO);
  const [editandoId, setEditandoId] = useState(null);
  const [erro, setErro] = useState('');
  const [aberto, setAberto] = useState(false);

  function carregar() {
    api.listarResponsaveis().then(setResponsaveis).catch((e) => setErro(e.message));
  }
  useEffect(carregar, []);

  const set = (campo) => (e) => setForm({ ...form, [campo]: e.target.value });

  function editar(r) {
    setEditandoId(r.id);
    setForm({ nome: r.nome, email: r.email });
    setAberto(true);
  }

  function novo() {
    setEditandoId(null);
    setForm(VAZIO);
    setAberto((v) => !v);
  }

  async function salvar(e) {
    e.preventDefault();
    setErro('');
    try {
      if (editandoId) {
        await api.atualizarResponsavel(editandoId, { email: form.email });
      } else {
        await api.criarResponsavel(form);
      }
      setForm(VAZIO);
      setEditandoId(null);
      setAberto(false);
      carregar();
    } catch (err) {
      setErro(err.message);
    }
  }

  return (
    <>
      <div className="topo-acoes">
        <h2>Responsaveis</h2>
        <button onClick={novo}>{aberto ? 'Cancelar' : 'Novo responsavel'}</button>
      </div>

      <Erro>{erro}</Erro>

      {aberto && (
        <form className="card" onSubmit={salvar}>
          <label>Nome *</label>
          <input
            value={form.nome}
            onChange={set('nome')}
            disabled={Boolean(editandoId)}
            placeholder="Ana Souza"
          />
          {editandoId && (
            <small className="muted">
              O nome nao pode ser alterado (e usado para vincular as NCs ja criadas ao
              e-mail).
            </small>
          )}
          <label>E-mail *</label>
          <input
            type="email"
            value={form.email}
            onChange={set('email')}
            placeholder="ana.souza@empresa.com"
          />
          <div style={{ marginTop: 12 }}>
            <button type="submit">Salvar</button>
          </div>
        </form>
      )}

      <table>
        <thead>
          <tr>
            <th>Nome</th>
            <th>E-mail</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {responsaveis.map((r) => (
            <tr key={r.id}>
              <td>{r.nome}</td>
              <td>{r.email}</td>
              <td style={{ textAlign: 'right' }}>
                <button className="secundario pequeno" onClick={() => editar(r)}>
                  Editar
                </button>
              </td>
            </tr>
          ))}
          {responsaveis.length === 0 && (
            <tr>
              <td colSpan={3} className="muted">
                Nenhum responsavel cadastrado.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </>
  );
}
