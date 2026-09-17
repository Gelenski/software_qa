import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { Erro } from '../components/ui.jsx';

const VAZIO = { nome: '', perguntas: [''] };

export default function ChecklistsPage() {
  const [templates, setTemplates] = useState([]);
  const [form, setForm] = useState(VAZIO);
  const [erro, setErro] = useState('');
  const [aberto, setAberto] = useState(false);
  const [detalhe, setDetalhe] = useState(null);
  const [copiandoId, setCopiandoId] = useState(null);
  const [nomeCopia, setNomeCopia] = useState('');

  function carregar() {
    api.listarChecklistTemplates().then(setTemplates).catch((e) => setErro(e.message));
  }
  useEffect(carregar, []);

  function alterarPergunta(i, valor) {
    const perguntas = [...form.perguntas];
    perguntas[i] = valor;
    setForm({ ...form, perguntas });
  }

  function adicionarPergunta() {
    setForm({ ...form, perguntas: [...form.perguntas, ''] });
  }

  function removerPergunta(i) {
    if (form.perguntas.length <= 1) return;
    setForm({ ...form, perguntas: form.perguntas.filter((_, idx) => idx !== i) });
  }

  async function salvar(e) {
    e.preventDefault();
    setErro('');
    try {
      await api.criarChecklistTemplate(form);
      setForm(VAZIO);
      setAberto(false);
      carregar();
    } catch (err) {
      setErro(err.message);
    }
  }

  function verItens(t) {
    if (detalhe?.template.id === t.id) {
      setDetalhe(null);
      return;
    }
    api.obterChecklistTemplate(t.id).then(setDetalhe).catch((e) => setErro(e.message));
  }

  function iniciarCopia(t) {
    setCopiandoId(t.id);
    setNomeCopia(`${t.nome} (copia)`);
  }

  async function confirmarCopia(e) {
    e.preventDefault();
    setErro('');
    try {
      await api.copiarChecklistTemplate(copiandoId, { nome: nomeCopia });
      setCopiandoId(null);
      setNomeCopia('');
      carregar();
    } catch (err) {
      setErro(err.message);
    }
  }

  return (
    <>
      <div className="topo-acoes">
        <h2>Checklists</h2>
        <button onClick={() => setAberto((v) => !v)}>
          {aberto ? 'Cancelar' : 'Novo checklist'}
        </button>
      </div>

      <Erro>{erro}</Erro>

      {aberto && (
        <form className="card" onSubmit={salvar}>
          <label>Nome *</label>
          <input
            value={form.nome}
            onChange={(e) => setForm({ ...form, nome: e.target.value })}
            placeholder="Checklist de regressao"
          />
          <label>Perguntas *</label>
          {form.perguntas.map((p, i) => (
            <div className="linha" key={i}>
              <div>
                <input
                  value={p}
                  onChange={(e) => alterarPergunta(i, e.target.value)}
                  placeholder={`Pergunta ${i + 1}`}
                />
              </div>
              <div>
                <button
                  type="button"
                  className="secundario pequeno"
                  onClick={() => removerPergunta(i)}
                >
                  Remover
                </button>
              </div>
            </div>
          ))}
          <div style={{ marginTop: 8 }}>
            <button type="button" className="secundario pequeno" onClick={adicionarPergunta}>
              + Adicionar pergunta
            </button>
          </div>
          <div style={{ marginTop: 12 }}>
            <button type="submit">Salvar</button>
          </div>
        </form>
      )}

      <table>
        <thead>
          <tr>
            <th>Nome</th>
            <th>Itens</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {templates.map((t) => (
            <tr key={t.id}>
              <td>{t.nome}</td>
              <td>{t.qtd_itens}</td>
              <td style={{ textAlign: 'right' }}>
                <button className="secundario pequeno" onClick={() => verItens(t)}>
                  Ver itens
                </button>{' '}
                <button className="secundario pequeno" onClick={() => iniciarCopia(t)}>
                  Copiar
                </button>
              </td>
            </tr>
          ))}
          {templates.length === 0 && (
            <tr>
              <td colSpan={3} className="muted">
                Nenhum checklist cadastrado.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {copiandoId && (
        <form className="card" onSubmit={confirmarCopia} style={{ marginTop: 16 }}>
          <h3 style={{ marginTop: 0 }}>Copiar checklist</h3>
          <label>Nome do novo checklist *</label>
          <input value={nomeCopia} onChange={(e) => setNomeCopia(e.target.value)} />
          <div style={{ marginTop: 12 }}>
            <button type="submit">Confirmar copia</button>{' '}
            <button
              type="button"
              className="secundario"
              onClick={() => setCopiandoId(null)}
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {detalhe && (
        <div className="card" style={{ marginTop: 16 }}>
          <h3 style={{ marginTop: 0 }}>{detalhe.template.nome}</h3>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Pergunta</th>
                <th>Ativo</th>
              </tr>
            </thead>
            <tbody>
              {detalhe.itens.map((it) => (
                <tr key={it.id}>
                  <td>{it.ordem}</td>
                  <td>{it.pergunta}</td>
                  <td>{it.ativo ? 'Sim' : 'Nao'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
