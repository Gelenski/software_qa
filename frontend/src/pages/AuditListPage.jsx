import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';
import { AderenciaBadge, Erro } from '../components/ui.jsx';

export default function AuditListPage() {
  const [auditorias, setAuditorias] = useState([]);
  const [casos, setCasos] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [casoId, setCasoId] = useState('');
  const [estrategia, setEstrategia] = useState('padrao');
  const [templateId, setTemplateId] = useState('');
  const [erro, setErro] = useState('');
  const navigate = useNavigate();

  function carregar() {
    api.listarAuditorias().then(setAuditorias).catch((e) => setErro(e.message));
  }
  useEffect(() => {
    carregar();
    api.listarCasos().then(setCasos).catch((e) => setErro(e.message));
    api.listarChecklistTemplates().then(setTemplates).catch((e) => setErro(e.message));
  }, []);

  async function iniciar(e) {
    e.preventDefault();
    setErro('');
    if (!casoId) return setErro('Selecione um caso de teste.');
    if (!templateId) return setErro('Selecione um checklist.');
    try {
      const r = await api.iniciarAuditoria({
        casoTesteId: Number(casoId),
        estrategia,
        checklistTemplateId: Number(templateId),
      });
      navigate(`/auditorias/${r.auditoria.id}`);
    } catch (err) {
      setErro(err.message);
    }
  }

  return (
    <>
      <h2>Auditorias</h2>
      <Erro>{erro}</Erro>

      <form className="card" onSubmit={iniciar}>
        <h3 style={{ marginTop: 0 }}>Iniciar auditoria</h3>
        <div className="linha">
          <div>
            <label>Caso de teste</label>
            <select value={casoId} onChange={(e) => setCasoId(e.target.value)}>
              <option value="">Selecione...</option>
              {casos.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.codigo} - {c.titulo}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label>Estrategia de aderencia</label>
            <select value={estrategia} onChange={(e) => setEstrategia(e.target.value)}>
              <option value="padrao">Padrao (ignora nao respondidos)</option>
              <option value="estrita">Estrita (nao respondido = nao conforme)</option>
            </select>
          </div>
          <div>
            <label>Checklist</label>
            <select value={templateId} onChange={(e) => setTemplateId(e.target.value)}>
              <option value="">Selecione...</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nome} ({t.qtd_itens} itens)
                </option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button type="submit">Iniciar</button>
          </div>
        </div>
      </form>

      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Caso</th>
            <th>Checklist</th>
            <th>Estrategia</th>
            <th>Status</th>
            <th>Aderencia</th>
            <th>NCs</th>
          </tr>
        </thead>
        <tbody>
          {auditorias.map((a) => (
            <tr key={a.id}>
              <td>
                <Link to={`/auditorias/${a.id}`}>{a.id}</Link>
              </td>
              <td>
                {a.caso_codigo} - {a.caso_titulo}
              </td>
              <td>{a.checklist_template_nome}</td>
              <td>{a.estrategia}</td>
              <td>
                <span className={`badge ${a.status === 'finalizada' ? 'verde' : 'azul'}`}>
                  {a.status}
                </span>
              </td>
              <td>
                <AderenciaBadge valor={a.aderencia} />
              </td>
              <td>{a.qtd_nc}</td>
            </tr>
          ))}
          {auditorias.length === 0 && (
            <tr>
              <td colSpan={7} className="muted">
                Nenhuma auditoria.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </>
  );
}
