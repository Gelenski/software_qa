import { NavLink, Route, Routes, Navigate } from "react-router-dom";
import DashboardPage from "./pages/DashboardPage.jsx";
import TestCasesPage from "./pages/TestCasesPage.jsx";
import ChecklistsPage from "./pages/ChecklistsPage.jsx";
import AuditListPage from "./pages/AuditListPage.jsx";
import AuditRunPage from "./pages/AuditRunPage.jsx";
import NcListPage from "./pages/NcListPage.jsx";
import NcDetailPage from "./pages/NcDetailPage.jsx";
import ResponsaveisPage from "./pages/ResponsaveisPage.jsx";

export default function App() {
  return (
    <div className="app">
      <aside className="sidebar">
        <h1>TestAudit</h1>
        <nav>
          <NavLink
            to="/dashboard"
            className={({ isActive }) => (isActive ? "ativo" : "")}
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/casos-teste"
            className={({ isActive }) => (isActive ? "ativo" : "")}
          >
            Casos de teste
          </NavLink>
          <NavLink
            to="/checklists"
            className={({ isActive }) => (isActive ? "ativo" : "")}
          >
            Checklists
          </NavLink>
          <NavLink
            to="/auditorias"
            className={({ isActive }) => (isActive ? "ativo" : "")}
          >
            Auditorias
          </NavLink>
          <NavLink
            to="/nao-conformidades"
            className={({ isActive }) => (isActive ? "ativo" : "")}
          >
            Nao conformidades
          </NavLink>
          <NavLink
            to="/responsaveis"
            className={({ isActive }) => (isActive ? "ativo" : "")}
          >
            Responsaveis
          </NavLink>
        </nav>
      </aside>

      <main className="conteudo">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/casos-teste" element={<TestCasesPage />} />
          <Route path="/checklists" element={<ChecklistsPage />} />
          <Route path="/auditorias" element={<AuditListPage />} />
          <Route path="/auditorias/:id" element={<AuditRunPage />} />
          <Route path="/nao-conformidades" element={<NcListPage />} />
          <Route path="/nao-conformidades/:id" element={<NcDetailPage />} />
          <Route path="/responsaveis" element={<ResponsaveisPage />} />
        </Routes>
      </main>
    </div>
  );
}
