import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';
import { Erro, useEnvio } from '../components/ui.jsx';

const VAZIO = {
  codigo: '',
  titulo: '',
  requisito: '',
  preCondicoes: '',
  passos: '',
  resultadoEsperado: '',
};

export default function TestCasesPage() {
  const [casos, setCasos] = useState([]);
  const [form, setForm] = useState(VAZIO);
  const [erro, setErro] = useState('');
  const [aberto, setAberto] = useState(false);
  const [detalhe, setDetalhe] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [templateId, setTemplateId] = useState('');
  const [importando, setImportando] = useState(false);
  const [resultadoImport, setResultadoImport] = useState(null);
  const inputArquivoRef = useRef(null);
  const navigate = useNavigate();
  const [salvando, enviarSalvar] = useEnvio();
  const [iniciando, enviarInicio] = useEnvio();

  function carregar() {
    return api.listarCasos().then(setCasos).catch((e) => setErro(e.message));
  }
  useEffect(() => {
    carregar();
  }, []);
  useEffect(() => {
    api.listarChecklistTemplates().then(setTemplates).catch((e) => setErro(e.message));
  }, []);

  const set = (campo) => (e) => setForm({ ...form, [campo]: e.target.value });

  function salvar(e) {
    e.preventDefault();
    return enviarSalvar(async () => {
      setErro('');
      try {
        await api.criarCaso(form);
        setForm(VAZIO);
        setAberto(false);
        await carregar();
      } catch (err) {
        setErro(err.message);
      }
    });
  }

  async function importarArquivo(e) {
    const arquivo = e.target.files[0];
    e.target.value = '';
    if (!arquivo) return;
    setErro('');
    setResultadoImport(null);
    setImportando(true);
    try {
      const resultado = await api.importarCasos(arquivo);
      setResultadoImport(resultado);
      carregar();
    } catch (err) {
      setErro(err.message);
    } finally {
      setImportando(false);
    }
  }

  function iniciarAuditoria(casoId) {
    setErro('');
    if (!templateId) {
      setErro('Selecione um checklist antes de iniciar a auditoria.');
      return;
    }
    return enviarInicio(async () => {
      try {
        const r = await api.iniciarAuditoria({
          casoTesteId: casoId,
          estrategia: 'padrao',
          checklistTemplateId: Number(templateId),
        });
        navigate(`/auditorias/${r.auditoria.id}`);
      } catch (err) {
        setErro(err.message);
      }
    });
  }

  return (
    <>
      <div className="topo-acoes">
        <h2>Casos de teste</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="file"
            accept=".xlsx"
            ref={inputArquivoRef}
            style={{ display: 'none' }}
            onChange={importarArquivo}
          />
          <button
            className="secundario"
            disabled={importando}
            onClick={() => inputArquivoRef.current.click()}
          >
            {importando ? 'Importando...' : 'Importar planilha'}
          </button>
          <button onClick={() => setAberto((v) => !v)}>
            {aberto ? 'Cancelar' : 'Novo caso de teste'}
          </button>
        </div>
      </div>

      <Erro>{erro}</Erro>

      {resultadoImport && (
        <div className="card" style={{ marginBottom: 16 }}>
          <p>
            <strong>{resultadoImport.importados}</strong> caso(s) de teste importado(s) com sucesso.
          </p>
          {resultadoImport.falhas.length > 0 && (
            <>
              <p className="muted">{resultadoImport.falhas.length} linha(s) com erro:</p>
              <ul>
                {resultadoImport.falhas.map((f) => (
                  <li key={f.linha}>
                    Linha {f.linha}
                    {f.codigo ? ` (${f.codigo})` : ''}: {f.erro}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}

      {templates.length === 0 ? (
        <p className="muted">
          Nenhum checklist cadastrado. <Link to="/checklists">Crie um checklist</Link> antes
          de iniciar uma auditoria.
        </p>
      ) : (
        <div style={{ marginBottom: 12 }}>
          <label>Checklist para a proxima auditoria</label>
          <select value={templateId} onChange={(e) => setTemplateId(e.target.value)}>
            <option value="">Selecione o checklist...</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nome} ({t.qtd_itens} itens)
              </option>
            ))}
          </select>
        </div>
      )}

      {aberto && (
        <form className={`card ${salvando ? 'enviando' : ''}`} onSubmit={salvar}>
          <div className="linha">
            <div>
              <label>Codigo *</label>
              <input value={form.codigo} onChange={set('codigo')} placeholder="CT-010" />
            </div>
            <div>
              <label>Requisito relacionado</label>
              <input
                value={form.requisito}
                onChange={set('requisito')}
                placeholder="RF-005"
              />
            </div>
          </div>
          <label>Titulo *</label>
          <input value={form.titulo} onChange={set('titulo')} />
          <label>Pre-condicoes</label>
          <textarea rows={2} value={form.preCondicoes} onChange={set('preCondicoes')} />
          <label>Passos</label>
          <textarea rows={3} value={form.passos} onChange={set('passos')} />
          <label>Resultado esperado</label>
          <textarea
            rows={2}
            value={form.resultadoEsperado}
            onChange={set('resultadoEsperado')}
          />
          <div style={{ marginTop: 12 }}>
            <button type="submit" disabled={salvando}>
              {salvando ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      )}

      <table>
        <thead>
          <tr>
            <th>Codigo</th>
            <th>Titulo</th>
            <th>Requisito</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {casos.map((c) => (
            <tr key={c.id}>
              <td>
                <button
                  className="secundario pequeno"
                  onClick={() => setDetalhe(detalhe?.id === c.id ? null : c)}
                >
                  {c.codigo}
                </button>
              </td>
              <td>{c.titulo}</td>
              <td>{c.requisito || <span className="muted">-</span>}</td>
              <td style={{ textAlign: 'right' }}>
                <button
                  className="pequeno"
                  disabled={templates.length === 0 || iniciando}
                  onClick={() => iniciarAuditoria(c.id)}
                >
                  {iniciando ? 'Iniciando...' : 'Iniciar auditoria'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {detalhe && (
        <div className="card" style={{ marginTop: 16 }}>
          <h3 style={{ marginTop: 0 }}>
            {detalhe.codigo} - {detalhe.titulo}
          </h3>
          <p>
            <strong>Requisito:</strong> {detalhe.requisito || '-'}
          </p>
          <p>
            <strong>Pre-condicoes:</strong>
            <br />
            <span style={{ whiteSpace: 'pre-wrap' }}>{detalhe.pre_condicoes || '-'}</span>
          </p>
          <p>
            <strong>Passos:</strong>
            <br />
            <span style={{ whiteSpace: 'pre-wrap' }}>{detalhe.passos || '-'}</span>
          </p>
          <p>
            <strong>Resultado esperado:</strong>
            <br />
            <span style={{ whiteSpace: 'pre-wrap' }}>
              {detalhe.resultado_esperado || '-'}
            </span>
          </p>
        </div>
      )}
    </>
  );
}
