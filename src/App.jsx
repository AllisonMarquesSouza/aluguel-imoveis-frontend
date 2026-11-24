import { useState } from 'react';
import { Navigate, NavLink, Outlet, Route, Routes } from 'react-router-dom';
import { can, useAuth } from './auth.jsx';
import { canAccessPanel } from './auth-session.js';
import { initials } from './ui.jsx';
import ChangePassword from './ChangePassword.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Corretores from './pages/Corretores.jsx';
import Usuarios from './pages/Usuarios.jsx';
import Empresas from './pages/Empresas.jsx';
import CadastrosAuxiliares from './pages/CadastrosAuxiliares.jsx';
import Proprietarios from './pages/Proprietarios.jsx';
import Imoveis from './pages/Imoveis.jsx';
import Loteamentos from './pages/Loteamentos.jsx';
import MinhaEmpresa from './pages/MinhaEmpresa.jsx';
import Contatos from './pages/Contatos.jsx';

function Shell() {
  const { session, logout } = useAuth();
  const [changingPassword, setChangingPassword] = useState(false);
  const [message, setMessage] = useState('');
  const nome = session.nome || session.email || 'Conta';
  return (
    <div className="shell">
      <aside className="side">
        <div className="brand"><i aria-hidden="true" />Meu Imóvel</div>
        <nav aria-label="Navegação principal">
          <NavLink to="/" end>Visão geral</NavLink>
          {can(session, 'GESTOR') && <NavLink to="/corretores">Corretores</NavLink>}
          {can(session, 'GESTOR', 'ADMINISTRADOR') && <NavLink to="/usuarios">Usuários</NavLink>}
          {can(session, 'CORRETOR') && <NavLink to="/proprietarios">Proprietários</NavLink>}
          {(can(session, 'CORRETOR') || can(session, 'GESTOR')) && <NavLink to="/imoveis">Imóveis</NavLink>}
          {(can(session, 'CORRETOR') || can(session, 'GESTOR')) && <NavLink to="/loteamentos">Loteamentos</NavLink>}
          {(can(session, 'CORRETOR') || can(session, 'GESTOR')) && <NavLink to="/contatos">Contatos</NavLink>}
          {can(session, 'GESTOR') && <NavLink to="/minha-empresa">Minha empresa</NavLink>}
          {can(session, 'ADMINISTRADOR') && <NavLink to="/empresas">Empresas</NavLink>}
          {can(session, 'ADMINISTRADOR') && <NavLink to="/cadastros">Cadastros</NavLink>}
        </nav>
        <div className="me">
          <span className="avatar">{initials(nome)}</span>
          <div>
            <strong>{nome}</strong>
            <small>{session.perfil ?? 'Sessão ativa'}</small>
          </div>
          <div className="me-actions"><button className="ghost" onClick={() => { setMessage(''); setChangingPassword(true); }}>Alterar senha</button><button className="ghost" onClick={logout}>Sair</button></div>
        </div>
      </aside>
      <main className="main"><Outlet /></main>
      {message && <div className="toast" role="status">{message}</div>}
      {changingPassword && <ChangePassword onClose={() => setChangingPassword(false)} onDone={() => { setChangingPassword(false); setMessage('Senha alterada com sucesso.'); setTimeout(() => setMessage(''), 4500); }} />}
    </div>
  );
}

function Protected() {
  const { session, logout, notice } = useAuth();
  const [changingPassword, setChangingPassword] = useState(false);
  const [message, setMessage] = useState('');
  if (!session) return <Navigate to="/login" replace />;
  if (!canAccessPanel(session)) {
    const detail = notice || (session.perfil === 'CLIENTE'
      ? 'O acesso do perfil CLIENTE permanece no aplicativo e não está disponível neste painel.'
      : 'A API autenticou a conta, mas não informou um perfil reconhecido. O painel não pode liberar páginas sem essa informação.');
    return (
      <>
        <main className="access-blocked">
          <section className="card" role="status">
            <h1>Acesso ao painel indisponível</h1>
            <p className="muted">{detail}</p>
            <div className="row-end"><button className="ghost" onClick={() => setChangingPassword(true)}>Alterar senha</button><button className="primary" onClick={() => logout()}>Encerrar sessão</button></div>
          </section>
        </main>
        {message && <div className="toast" role="status">{message}</div>}
        {changingPassword && <ChangePassword onClose={() => setChangingPassword(false)} onDone={() => { setChangingPassword(false); setMessage('Senha alterada com sucesso.'); setTimeout(() => setMessage(''), 4500); }} />}
      </>
    );
  }
  return <Shell />;
}

function AccessDenied() {
  return (
    <main className="access-blocked">
      <section className="card" role="status">
        <h1>Acesso não permitido</h1>
        <p className="muted">Seu perfil não tem permissão para abrir esta área do painel.</p>
        <NavLink className="ghost button-link" to="/">Voltar à visão geral</NavLink>
      </section>
    </main>
  );
}

export default function App() {
  const { session } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={session ? <Navigate to="/" replace /> : <Login />} />
      <Route element={<Protected />}>
        <Route index element={<Dashboard />} />
        <Route path="corretores" element={can(session, 'GESTOR') ? <Corretores /> : <AccessDenied />} />
        <Route path="proprietarios" element={can(session, 'CORRETOR') ? <Proprietarios /> : <AccessDenied />} />
        <Route path="imoveis" element={can(session, 'CORRETOR', 'GESTOR') ? <Imoveis /> : <AccessDenied />} />
        <Route path="loteamentos" element={can(session, 'CORRETOR', 'GESTOR') ? <Loteamentos /> : <AccessDenied />} />
        <Route path="minha-empresa" element={can(session, 'GESTOR') ? <MinhaEmpresa /> : <AccessDenied />} />
        <Route path="contatos" element={can(session, 'CORRETOR', 'GESTOR') ? <Contatos /> : <AccessDenied />} />
        <Route path="empresas" element={can(session, 'ADMINISTRADOR') ? <Empresas /> : <AccessDenied />} />
        <Route path="cadastros" element={can(session, 'ADMINISTRADOR') ? <CadastrosAuxiliares /> : <AccessDenied />} />
        <Route path="usuarios" element={can(session, 'ADMINISTRADOR', 'GESTOR') ? <Usuarios /> : <AccessDenied />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
