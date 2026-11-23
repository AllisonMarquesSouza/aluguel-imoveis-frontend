import { Navigate, NavLink, Outlet, Route, Routes } from 'react-router-dom';
import { can, useAuth } from './auth.jsx';
import { initials } from './ui.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Corretores from './pages/Corretores.jsx';
import Usuarios from './pages/Usuarios.jsx';
import Empresas from './pages/Empresas.jsx';
import CadastrosAuxiliares from './pages/CadastrosAuxiliares.jsx';
import Proprietarios from './pages/Proprietarios.jsx';

function Shell() {
  const { session, logout } = useAuth();
  const nome = session.nome || session.email || 'Conta';
  return (
    <div className="shell">
      <aside className="side">
        <div className="brand"><i aria-hidden="true" />Meu Imóvel</div>
        <nav aria-label="Navegação principal">
          <NavLink to="/" end>Visão geral</NavLink>
          {can(session, 'GESTOR') && <NavLink to="/corretores">Corretores</NavLink>}
          {can(session, 'CORRETOR') && <NavLink to="/proprietarios">Proprietários</NavLink>}
          {can(session, 'ADMINISTRADOR') && <NavLink to="/empresas">Empresas</NavLink>}
          {can(session, 'ADMINISTRADOR') && <NavLink to="/cadastros">Cadastros</NavLink>}
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
  const { session, logout, notice } = useAuth();
  if (!session) return <Navigate to="/login" replace />;
  if (!session.perfil || session.perfil === 'CLIENTE') {
    const detail = notice || (session.perfil === 'CLIENTE'
      ? 'O acesso do perfil CLIENTE permanece no aplicativo e não está disponível neste painel.'
      : 'A API autenticou a conta, mas não informou um perfil reconhecido. O painel não pode liberar páginas sem essa informação.');
    return (
      <main className="access-blocked">
        <section className="card" role="status">
          <h1>Acesso ao painel indisponível</h1>
          <p className="muted">{detail}</p>
          <button className="primary" onClick={() => logout()}>Encerrar sessão</button>
        </section>
      </main>
    );
  }
  return <Shell />;
}

export default function App() {
  const { session } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={session ? <Navigate to="/" replace /> : <Login />} />
      <Route element={<Protected />}>
        <Route index element={<Dashboard />} />
        <Route path="corretores" element={can(session, 'GESTOR') ? <Corretores /> : <Navigate to="/" replace />} />
        <Route path="proprietarios" element={can(session, 'CORRETOR') ? <Proprietarios /> : <Navigate to="/" replace />} />
        <Route path="empresas" element={can(session, 'ADMINISTRADOR') ? <Empresas /> : <Navigate to="/" replace />} />
        <Route path="cadastros" element={can(session, 'ADMINISTRADOR') ? <CadastrosAuxiliares /> : <Navigate to="/" replace />} />
        <Route path="usuarios" element={can(session, 'ADMINISTRADOR') ? <Usuarios /> : <Navigate to="/" replace />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
