import { Navigate, NavLink, Outlet, Route, Routes } from 'react-router-dom';
import { can, useAuth } from './auth.jsx';
import { initials } from './ui.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Corretores from './pages/Corretores.jsx';
import Usuarios from './pages/Usuarios.jsx';

function Shell() {
  const { session, logout } = useAuth();
  const nome = session.nome || session.email || 'Conta';
  return (
    <div className="shell">
      <aside className="side">
        <div className="brand"><i />Meu Imóvel</div>
        <nav>
          <NavLink to="/" end>Visão geral</NavLink>
          <NavLink to="/corretores">Corretores</NavLink>
          {can(session, 'ADMINISTRADOR') && <NavLink to="/usuarios">Usuários</NavLink>}
        </nav>
        <div className="me">
          <span className="avatar">{initials(nome)}</span>
          <div>
            <strong>{nome}</strong>
            <small>{session.perfil ?? 'Sessão ativa'}</small>
          </div>
          <button className="ghost" onClick={logout}>Sair</button>
        </div>
      </aside>
      <main className="main"><Outlet /></main>
    </div>
  );
}

function Protected() {
  const { session } = useAuth();
  return session ? <Shell /> : <Navigate to="/login" replace />;
}

export default function App() {
  const { session } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={session ? <Navigate to="/" replace /> : <Login />} />
      <Route element={<Protected />}>
        <Route index element={<Dashboard />} />
        <Route path="corretores" element={<Corretores />} />
        <Route path="usuarios" element={can(session, 'ADMINISTRADOR') ? <Usuarios /> : <Navigate to="/" replace />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
