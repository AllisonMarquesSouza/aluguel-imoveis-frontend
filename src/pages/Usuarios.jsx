import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { Field, useToast } from '../ui.jsx';

const PERFIS = [
  ['ADMINISTRADOR', 'Administrador'],
  ['GESTOR', 'Gestor'],
  ['CORRETOR', 'Corretor'],
  ['CLIENTE', 'Cliente'],
];
const empty = { nome: '', email: '', senha: '', perfil: 'GESTOR', empresaId: '' };

export default function Usuarios() {
  const [f, setF] = useState(empty);
  const [empresas, setEmpresas] = useState([]);
  const [criados, setCriados] = useState([]);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [toast, show] = useToast();
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const semEmpresa = f.perfil === 'ADMINISTRADOR';

  useEffect(() => { api.get('/empresa').then(setEmpresas).catch((e) => setErr(e.message)); }, []);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setErr('');
    try {
      const u = await api.post('/auth/register', {
        nome: f.nome,
        email: f.email,
        senha: f.senha,
        perfil: f.perfil,
        empresaId: semEmpresa ? null : Number(f.empresaId),
      });
      setCriados([{ ...u, nome: f.nome }, ...criados]);
      setF({ ...empty, perfil: f.perfil, empresaId: f.empresaId });
      show('Usuário criado.');
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <header className="page-head">
        <div>
          <h1>Usuários</h1>
          <p className="muted">Crie contas de acesso ao painel e ao app.</p>
        </div>
      </header>

      <div className="split">
        <form className="card form" onSubmit={submit}>
          <Field label="Nome"><input value={f.nome} onChange={set('nome')} maxLength={150} required /></Field>
          <Field label="E-mail"><input type="email" value={f.email} onChange={set('email')} maxLength={255} required /></Field>
          <Field label="Senha" hint="Mínimo de 12 caracteres.">
            <input type="password" minLength={12} maxLength={255} value={f.senha} onChange={set('senha')} required autoComplete="new-password" />
          </Field>
          <Field label="Perfil">
            <select value={f.perfil} onChange={set('perfil')}>
              {PERFIS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </Field>
          {!semEmpresa && (
            <Field label="Imobiliária">
              <select value={f.empresaId} onChange={set('empresaId')} required>
                <option value="" disabled>Escolha a imobiliária</option>
                {empresas.map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}
              </select>
            </Field>
          )}
          {err && <p className="error" role="alert">{err}</p>}
          <button className="primary" disabled={busy}>{busy ? 'Criando…' : 'Criar usuário'}</button>
        </form>

        <aside className="card">
          <h3>Criados nesta sessão</h3>
          {criados.length === 0 && <p className="muted">Os usuários que você criar aparecem aqui.</p>}
          <ul className="plain">
            {criados.map((u) => (
              <li key={u.id}>
                <strong>{u.nome}</strong>
                <small>{u.email} · {u.perfil}</small>
              </li>
            ))}
          </ul>
          <p className="muted note">
            Corretores que aparecem na vitrine (com foto, CRECI e contato) são cadastrados pelo gestor, em Corretores.
          </p>
        </aside>
      </div>
      {toast}
    </>
  );
}
