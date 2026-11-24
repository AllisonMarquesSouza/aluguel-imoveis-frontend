import { useCallback, useEffect, useState } from 'react';
import { api, assetUrl, multipart } from '../api.js';
import { Field, Modal, useToast } from '../ui.jsx';

const empty = { nome: '', email: '', senha: '', creci: '', telefone: '', whatsapp: '', apresentacao: '' };

export default function Corretores() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [brokers, setBrokers] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');
  const [toast, show] = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [active, inactive] = await Promise.all([
        api.get('/corretor/empresa/ativos'),
        api.get('/corretor/empresa/inativos'),
      ]);
      if (!Array.isArray(active) || !Array.isArray(inactive)) {
        throw new Error('A API retornou as listas de corretores em formato inesperado.');
      }
      setBrokers([
        ...active.map((broker) => ({ ...broker, situacao: 'ATIVO' })),
        ...inactive.map((broker) => ({ ...broker, situacao: 'INATIVO' })),
      ]);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function created() {
    setOpen(false);
    show('Corretor cadastrado.');
    await load();
  }

  async function changeStatus(broker) {
    const active = broker.situacao === 'ATIVO';
    const action = active ? 'desativar' : 'ativar';
    const actionLabel = active ? 'Desativar' : 'Ativar';
    if (!confirm(`${actionLabel} ${broker.nome}?`)) return;
    setBusyId(broker.id);
    setError('');
    try {
      await api.patch(`/corretor/${action}/${broker.id}`);
      setBrokers((current) => current?.map((item) => item.id === broker.id
        ? { ...item, situacao: active ? 'INATIVO' : 'ATIVO' }
        : item) ?? current);
      show(`Corretor ${active ? 'desativado' : 'ativado'}.`);
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <header className="page-head">
        <div>
          <h1>Equipe de corretores</h1>
          <p className="muted">Corretores vinculados à imobiliária do gestor autenticado.</p>
        </div>
        <div className="row-end">
          <button className="ghost" onClick={load} disabled={loading}>Atualizar</button>
          <button className="primary" onClick={() => setOpen(true)}>Novo corretor</button>
        </div>
      </header>

      <p className="notice" role="status">
        As listas de ativos e inativos são limitadas à empresa do gestor autenticado. A situação exibida corresponde à lista retornada pela API.
      </p>

      {error && <div className="request-state"><p className="error" role="alert">{error}</p><button className="ghost" onClick={load}>Tentar novamente</button></div>}
      {loading && <p className="muted page-message" role="status">Carregando equipe…</p>}
      {!loading && !error && brokers?.length === 0 && <p className="empty" role="status">Nenhum corretor cadastrado nesta empresa.</p>}
      {brokers?.length > 0 && (
        <div className="table-wrap" role="region" aria-label="Equipe de corretores" tabIndex={0}>
          <table className="data-table">
            <thead><tr><th>Corretor</th><th>CRECI</th><th>Telefone</th><th>WhatsApp</th><th>Situação</th><th>Ações</th></tr></thead>
            <tbody>
              {brokers.map((broker) => (
                <tr key={broker.id}>
                  <td>
                    <div className="broker-identity">
                      {broker.fotoUrl && <img className="broker-photo" src={assetUrl(broker.fotoUrl)} alt="" />}
                      <span><strong>{broker.nome}</strong><small>{broker.email}</small></span>
                    </div>
                  </td>
                  <td>{broker.creci}</td>
                  <td>{broker.telefone}</td>
                  <td>{broker.whatsapp}</td>
                  <td><span className={`status-pill ${broker.situacao === 'ATIVO' ? 'active' : 'inactive'}`}>{broker.situacao === 'ATIVO' ? 'Ativo' : 'Inativo'}</span></td>
                  <td><div className="row-end">
                    <button className="ghost" onClick={() => setEditing(broker)}>Editar</button>
                    <button className={`ghost ${broker.situacao === 'ATIVO' ? 'danger' : ''}`} onClick={() => changeStatus(broker)} disabled={busyId === broker.id}>
                      {busyId === broker.id ? 'Salvando…' : broker.situacao === 'ATIVO' ? 'Desativar' : 'Ativar'}
                    </button>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {open && <NovoCorretor onClose={() => setOpen(false)} onDone={created} />}
      {editing && <EditarCorretor broker={editing} onClose={() => setEditing(null)} onDone={async () => { setEditing(null); show('Dados do corretor atualizados.'); await load(); }} />}
      {toast}
    </>
  );
}

function EditarCorretor({ broker, onClose, onDone }) {
  const [form, setForm] = useState({
    nome: broker.nome || '', email: broker.email || '', creci: broker.creci || '',
    telefone: broker.telefone || '', whatsapp: broker.whatsapp || '', apresentacao: broker.apresentacao || '',
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const update = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api.put(`/corretor/${broker.id}`, {
        nome: form.nome.trim(), email: form.email.trim(), creci: form.creci.trim(),
        telefone: form.telefone.trim(), whatsapp: form.whatsapp.trim(), apresentacao: form.apresentacao.trim(),
      });
      await onDone();
    } catch (requestError) {
      setError(requestError.message);
      setBusy(false);
    }
  }

  return <Modal title={`Editar corretor · ${broker.nome}`} onClose={onClose}>
    <form className="form two" onSubmit={submit}>
      <Field label="Nome"><input value={form.nome} onChange={update('nome')} required maxLength={150} /></Field>
      <Field label="CRECI"><input value={form.creci} onChange={update('creci')} required maxLength={30} /></Field>
      <Field label="E-mail"><input type="email" value={form.email} onChange={update('email')} required maxLength={255} /></Field>
      <Field label="Telefone"><input value={form.telefone} onChange={update('telefone')} required maxLength={20} /></Field>
      <Field label="WhatsApp"><input value={form.whatsapp} onChange={update('whatsapp')} required maxLength={20} /></Field>
      <div className="span2"><Field label="Apresentação"><textarea rows={4} value={form.apresentacao} onChange={update('apresentacao')} required /></Field></div>
      <p className="muted span2">Senha e foto são mantidas por operações próprias da API.</p>
      {error && <p className="error span2" role="alert">{error}</p>}
      <div className="row-end span2"><button type="button" className="ghost" onClick={onClose} disabled={busy}>Cancelar</button><button className="primary" disabled={busy}>{busy ? 'Salvando…' : 'Salvar alterações'}</button></div>
    </form>
  </Modal>;
}

function NovoCorretor({ onClose, onDone }) {
  const [f, setF] = useState(empty);
  const [foto, setFoto] = useState(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF((current) => ({ ...current, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    if (!foto) return setErr('Escolha uma foto do corretor.');
    setBusy(true);
    setErr('');
    try {
      await api.form('POST', '/corretor', multipart(f, { foto }));
      await onDone();
    } catch (e) {
      setErr(e.message);
      setBusy(false);
    }
  }

  return (
    <Modal title="Novo corretor da imobiliária" onClose={onClose}>
      <form onSubmit={submit} className="form two">
        <Field label="Nome"><input value={f.nome} onChange={set('nome')} required maxLength={150} /></Field>
        <Field label="CRECI"><input value={f.creci} onChange={set('creci')} required maxLength={30} /></Field>
        <Field label="E-mail"><input type="email" value={f.email} onChange={set('email')} required maxLength={255} /></Field>
        <Field label="Senha" hint="Mínimo de 12 caracteres.">
          <input type="password" minLength={12} maxLength={255} value={f.senha} onChange={set('senha')} required autoComplete="new-password" />
        </Field>
        <Field label="Telefone"><input value={f.telefone} onChange={set('telefone')} required maxLength={20} /></Field>
        <Field label="WhatsApp"><input value={f.whatsapp} onChange={set('whatsapp')} required maxLength={20} /></Field>
        <div className="span2">
          <Field label="Apresentação"><textarea rows={3} value={f.apresentacao} onChange={set('apresentacao')} required /></Field>
        </div>
        <div className="span2">
          <Field label="Foto" hint="JPEG, PNG ou WebP.">
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setFoto(e.target.files[0] ?? null)} required />
          </Field>
        </div>
        {err && <p className="error span2" role="alert">{err}</p>}
        <div className="span2 row-end">
          <button type="button" className="ghost" onClick={onClose}>Cancelar</button>
          <button className="primary" disabled={busy}>{busy ? 'Salvando…' : 'Cadastrar corretor'}</button>
        </div>
      </form>
    </Modal>
  );
}
