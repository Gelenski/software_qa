import { useState } from "react";
import { NavLink, Route, Routes, Navigate } from "react-router-dom";
import { getSessao, logout } from "./auth.js";
import LoginPage from "./pages/LoginPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import TestCasesPage from "./pages/TestCasesPage.jsx";
import ChecklistsPage from "./pages/ChecklistsPage.jsx";
import AuditListPage from "./pages/AuditListPage.jsx";
import AuditRunPage from "./pages/AuditRunPage.jsx";
import NcListPage from "./pages/NcListPage.jsx";
import NcDetailPage from "./pages/NcDetailPage.jsx";
import ResponsaveisPage from "./pages/ResponsaveisPage.jsx";
import MinhasTarefasPage from "./pages/MinhasTarefasPage.jsx";

const ROTAS = [
  { path: "/minhas-tarefas", label: "Minhas tarefas", element: <MinhasTarefasPage />, papeis: ["tester"] },
  { path: "/dashboard", label: "Dashboard", element: <DashboardPage />, papeis: ["auditor", "tester"] },
  { path: "/casos-teste", label: "Casos de teste", element: <TestCasesPage />, papeis: ["tester"] },
  { path: "/checklists", label: "Checklists", element: <ChecklistsPage />, papeis: ["auditor"] },
  { path: "/auditorias", label: "Auditorias", element: <AuditListPage />, papeis: ["auditor"] },
  { path: "/auditorias/:id", element: <AuditRunPage />, papeis: ["auditor"] },
  { path: "/nao-conformidades", label: "Nao conformidades", element: <NcListPage />, papeis: ["auditor"] },
  { path: "/nao-conformidades/:id", element: <NcDetailPage />, papeis: ["auditor", "tester"] },
  { path: "/responsaveis", label: "Responsaveis", element: <ResponsaveisPage />, papeis: ["auditor"] },
];

export default function App() {
  const [sessao, setSessao] = useState(getSessao());

  if (!sessao) return <LoginPage aoLogar={setSessao} />;

  const rotasPermitidas = ROTAS.filter((r) => r.papeis.includes(sessao.papel));
  const primeiraRota = rotasPermitidas[0].path;

  function sair() {
    logout();
    setSessao(null);
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <h1>TestAudit</h1>
        <nav>
          {rotasPermitidas
            .filter((r) => r.label)
            .map((r) => (
              <NavLink key={r.path} to={r.path} className={({ isActive }) => (isActive ? "ativo" : "")}>
                {r.label}
              </NavLink>
            ))}
        </nav>
        <div style={{ padding: "16px 20px", color: "#dbe6f7" }}>
          <div style={{ marginBottom: 8 }}>{sessao.nome}</div>
          <button className="secundario pequeno" onClick={sair}>Sair</button>
        </div>
      </aside>

      <main className="conteudo">
        <Routes>
          <Route path="/" element={<Navigate to={primeiraRota} replace />} />
          {rotasPermitidas.map((r) => (
            <Route key={r.path} path={r.path} element={r.element} />
          ))}
          <Route path="*" element={<Navigate to={primeiraRota} replace />} />
        </Routes>
      </main>
    </div>
  );
}
