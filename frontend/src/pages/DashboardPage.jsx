import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client.js";
import { AderenciaBadge, Erro } from "../components/ui.jsx";

function Kpi({ rotulo, valor }) {
  return (
    <div className="kpi">
      <div className="valor">{valor}</div>
      <div className="rotulo">{rotulo}</div>
    </div>
  );
}

export default function DashboardPage() {
  const [dados, setDados] = useState(null);
  const [erro, setErro] = useState("");

  useEffect(() => {
    api
      .dashboard()
      .then(setDados)
      .catch((e) => setErro(e.message));
  }, []);

  if (erro) return <Erro>{erro}</Erro>;
  if (!dados) return <p className="muted">Carregando...</p>;

  const { auditorias, naoConformidades: nc } = dados;

  return (
    <>
      <h2>Dashboard</h2>

      <h3>Nao conformidades</h3>
      <div className="grid-cards">
        <Kpi rotulo="Abertas" valor={nc.abertas} />
        <Kpi rotulo="Atrasadas" valor={nc.atrasadas} />
        <Kpi rotulo="Resolvidas" valor={nc.resolvidas} />
      </div>

      <h3 style={{ marginTop: 24 }}>Auditorias</h3>
      <div className="grid-cards">
        <Kpi rotulo="Realizadas" valor={auditorias.total} />
        <Kpi rotulo="Finalizadas" valor={auditorias.finalizadas} />
        <Kpi
          rotulo="Aderencia media"
          valor={
            auditorias.aderenciaMedia == null
              ? "--"
              : `${auditorias.aderenciaMedia.toFixed(2)}%`
          }
        />
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <h3 style={{ marginTop: 0 }}>Auditorias realizadas</h3>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Caso de teste</th>
              <th>Estratégia</th>
              <th>Status</th>
              <th>Aderência</th>
              <th>NCs</th>
            </tr>
          </thead>
          <tbody>
            {auditorias.lista.map((a) => (
              <tr key={a.id}>
                <td>
                  <Link to={`/auditorias/${a.id}`}>{a.id}</Link>
                </td>
                <td>{a.caso}</td>
                <td>{a.estrategia}</td>
                <td>
                  <span
                    className={`badge ${a.status === "finalizada" ? "verde" : "azul"}`}
                  >
                    {a.status}
                  </span>
                </td>
                <td>
                  <AderenciaBadge valor={a.aderencia} />
                </td>
                <td>{a.qtdNc}</td>
              </tr>
            ))}
            {auditorias.lista.length === 0 && (
              <tr>
                <td colSpan={6} className="muted">
                  Nenhuma auditoria ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
