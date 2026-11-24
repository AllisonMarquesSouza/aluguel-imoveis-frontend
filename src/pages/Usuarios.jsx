import { useCallback, useEffect, useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { Field, Modal, useToast } from '../ui.jsx';

const PERFIS_CADASTRO = [
  ['ADMINISTRADOR', 'Administrador'],
  ['GESTOR', 'Gestor'],
  ['CLIENTE', 'Cliente'],
];
const STATUS = [
  ['ATIVO', 'Ativo'],
  ['INATIVO', 'Inativo'],
  ['BLOQUEADO', 'Bloqueado'],
];
const empty = { nome: '', email: '', senha: '', perfil: 'GESTOR', empresaId: '' };

export default function Usuarios() {
  const { session } = useAuth();
  const isAdmin = session?.perfil === 'ADMINISTRADOR';
  const [form, setForm] = useState(empty);
  const [companies, setCompanies] = useState([]);
  const [users, setUsers] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [registerError, setRegisterError] = useState('');
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(null);
  const [changingStatus, setChangingStatus] = useState(null);
  const [toast, show] = useToast();
  const update = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));
  const noCompany = form.perfil === 'ADMINISTRADOR';

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/usuario');
      if (!Array.isArray(response)) throw new Error('A API retornou os usuários em formato inesperado.');
      setUsers(response);
    } catch (requestError) {
      setError(requestError.message);
      setUsers(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);
  useEffect(() => {
    if (!isAdmin) return;
    api.get('/empresa').then(setCompanies).catch((requestError) => setRegisterError(`Empresas: ${requestError.message}`));
  }, [isAdmin]);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setRegisterError('');
    try {
      await api.post('/auth/register', {
        nome: form.nome.trim(), email: form.email.trim(), senha: form.senha,
        perfil: form.perfil, empresaId: noCompany ? null : Number(form.empresaId),
      });
      setForm({ ...empty, perfil: form.perfil, empresaId: form.empresaId });
      show('Usuário criado.');
      await loadUsers();
    } catch (requestError) {
      setRegisterError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  async function userSaved() {
    setEditing(null);
    setChangingStatus(null);
    show('Usuário atualizado.');
    await loadUsers();
  }

  return <>
    <header className="page-head">
      <div>
        <h1>{isAdmin ? 'Usuários' : 'Usuários da empresa'}</h1>
        <p className="muted">Consulte, edite e altere a situação das contas no escopo autorizado pela API.</p>
      </div>
      <button className="ghost" onClick={loadUsers} disabled={loading}>Atualizar</button>
    </header>

    {isAdmin && <section className="card management-section">
      <div className="section-head"><div><h2>Criar conta geral</h2><p className="muted">Cadastros profissionais de corretores continuam nos fluxos próprios.</p></div></div>
      <form className="form two" onSubmit={submit}>
        <Field label="Nome"><input value={form.nome} onChange={update('nome')} maxLength={150} required /></Field>
        <Field label="E-mail"><input type="email" value={form.email} onChange={update('email')} maxLength={255} required /></Field>
        <Field label="Senha" hint="Use de 12 a 255 caracteres."><input type="password" minLength={12} maxLength={255} value={form.senha} onChange={update('senha')} required autoComplete="new-password" /></Field>
        <Field label="Perfil"><select value={form.perfil} onChange={update('perfil')}>{PERFIS_CADASTRO.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field>
        {!noCompany && <Field label="Imobiliária"><select value={form.empresaId} onChange={update('empresaId')} required><option value="" disabled>Escolha a imobiliária</option>{companies.map((company) => <option key={company.id} value={company.id}>{company.nome}</option>)}</select></Field>}
        {registerError && <p className="error span2" role="alert">{registerError}</p>}
        <div className="row-end span2"><button className="primary" disabled={busy || (!noCompany && companies.length === 0)}>{busy ? 'Criando…' : 'Criar usuário'}</button></div>
      </form>
      <p className="muted note">O cadastro do corretor autônomo acontece em Empresas; o cadastro de corretor vinculado acontece em Corretores.</p>
    </section>}

    {error && <div className="request-state"><p className="error" role="alert">{error}</p><button className="ghost" onClick={loadUsers}>Tentar novamente</button></div>}
    {loading && <p className="muted page-message" role="status">Carregando usuários…</p>}
    {!loading && !error && users?.length === 0 && <p className="empty" role="status">Nenhum usuário encontrado neste escopo.</p>}
    {users?.length > 0 && <div className="table-wrap" role="region" aria-label="Usuários" tabIndex={0}>
      <table className="data-table">
        <thead><tr><th>Usuário</th><th>Perfil</th><th>Empresa</th><th>Situação</th><th>Cadastro</th><th>Ações</th></tr></thead>
        <tbody>{users.map((user) => <tr key={user.id}>
          <td><strong>{user.nome}</strong><small>{user.email}</small></td>
          <td>{user.perfil}</td>
          <td>{user.empresaId ?? '—'}</td>
          <td><span className={`status-pill ${user.status === 'ATIVO' ? 'active' : 'inactive'}`}>{statusLabel(user.status)}</span></td>
          <td>{user.criadoEm ? new Date(user.criadoEm).toLocaleDateString('pt-BR') : '—'}</td>
          <td><div className="row-end"><button className="ghost" onClick={() => setEditing(user)}>Editar</button><button className="ghost" onClick={() => setChangingStatus(user)}>Situação</button></div></td>
        </tr>)}</tbody>
      </table>
    </div>}

    {editing && <EditUser user={editing} onClose={() => setEditing(null)} onDone={userSaved} />}
    {changingStatus && <ChangeUserStatus user={changingStatus} onClose={() => setChangingStatus(null)} onDone={userSaved} />}
    {toast}
  </>;
}

function statusLabel(value) {
  return STATUS.find(([status]) => status === value)?.[1] || value || '—';
}

function EditUser({ user, onClose, onDone }) {
  const [form, setForm] = useState({ nome: user.nome || '', email: user.email || '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const update = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api.put(`/usuario/${user.id}`, { nome: form.nome.trim(), email: form.email.trim() });
      await onDone();
    } catch (requestError) {
      setError(requestError.message);
      setBusy(false);
    }
  }

  return <Modal title={`Editar usuário · ${user.nome}`} onClose={onClose}>
    <form className="form" onSubmit={submit}>
      <Field label="Nome"><input value={form.nome} onChange={update('nome')} required maxLength={150} /></Field>
      <Field label="E-mail"><input type="email" value={form.email} onChange={update('email')} required maxLength={255} /></Field>
      <p className="muted">Perfil e empresa são mantidos pela API e não podem ser alterados neste formulário.</p>
      {error && <p className="error" role="alert">{error}</p>}
      <div className="row-end"><button type="button" className="ghost" onClick={onClose} disabled={busy}>Cancelar</button><button className="primary" disabled={busy}>{busy ? 'Salvando…' : 'Salvar alterações'}</button></div>
    </form>
  </Modal>;
}

function ChangeUserStatus({ user, onClose, onDone }) {
  const [status, setStatus] = useState(user.status || 'ATIVO');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    const label = STATUS.find(([value]) => value === status)?.[1] || status;
    if (!confirm(`Definir a situação de ${user.nome} como ${label}?`)) return;
    setBusy(true);
    setError('');
    try {
      await api.patch(`/usuario/${user.id}/situacao`, { status });
      await onDone();
    } catch (requestError) {
      setError(requestError.message);
      setBusy(false);
    }
  }

  return <Modal title={`Situação · ${user.nome}`} onClose={onClose}>
    <form className="form" onSubmit={submit}>
      <Field label="Situação"><select value={status} onChange={(event) => setStatus(event.target.value)}>{STATUS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field>
      {error && <p className="error" role="alert">{error}</p>}
      <div className="row-end"><button type="button" className="ghost" onClick={onClose} disabled={busy}>Cancelar</button><button className="primary" disabled={busy || status === user.status}>{busy ? 'Salvando…' : 'Salvar situação'}</button></div>
    </form>
  </Modal>;
}
