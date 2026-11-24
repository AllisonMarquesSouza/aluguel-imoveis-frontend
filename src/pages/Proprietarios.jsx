import { useState } from 'react';
import { api } from '../api.js';
import { Field, Modal, useToast } from '../ui.jsx';

const EMPTY = {
  tipoDocumento: 'CPF',
  documento: '',
  nome: '',
  telefone: '',
  email: '',
  observacoes: '',
};

const normalizeDocument = (value) => value.replace(/[^a-z0-9]/gi, '').toUpperCase();

export default function Proprietarios() {
  const [mode, setMode] = useState('nome');
  const [tipoDocumento, setTipoDocumento] = useState('CPF');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [toast, show] = useToast();

  async function search(event) {
    event?.preventDefault();
    if (!query.trim()) {
      setError(mode === 'nome' ? 'Informe um nome para pesquisar.' : 'Informe um documento para pesquisar.');
      setResults(null);
      return;
    }

    setBusy(true);
    setError('');
    try {
      if (mode === 'nome') {
        const data = await api.get(`/proprietario?nome=${encodeURIComponent(query.trim())}`);
        if (!Array.isArray(data)) throw new Error('A API retornou um formato inesperado.');
        setResults(data);
      } else {
        const data = await api.get(`/proprietario/documento?tipoDocumento=${tipoDocumento}&documento=${encodeURIComponent(query.trim())}`);
        setResults(data ? [data] : []);
      }
    } catch (e) {
      if (mode === 'documento' && e.status === 404) {
        setResults([]);
      } else {
        setError(e.message);
        setResults(null);
      }
    } finally {
      setBusy(false);
    }
  }

  async function created(owner) {
    setOpen(false);
    show('Proprietário cadastrado.');
    const matchesCurrentSearch = mode === 'nome'
      ? owner.nome.toLowerCase().includes(query.trim().toLowerCase())
      : normalizeDocument(owner.documento) === normalizeDocument(query);
    if (query.trim() && matchesCurrentSearch) await search();
  }

  return (
    <>
      <header className="page-head">
        <div>
          <h1>Proprietários</h1>
          <p className="muted">Pesquise e cadastre proprietários da sua empresa.</p>
        </div>
        <button className="primary" onClick={() => setOpen(true)}>Novo proprietário</button>
      </header>

      <form className={`card search-form ${mode === 'documento' ? 'with-doc-type' : ''}`} onSubmit={search} aria-busy={busy}>
        <Field label="Pesquisar por">
          <select value={mode} onChange={(event) => { setMode(event.target.value); setResults(null); setError(''); }}>
            <option value="nome">Nome</option>
            <option value="documento">Documento</option>
          </select>
        </Field>
        {mode === 'documento' && (
          <Field label="Tipo de documento">
            <select value={tipoDocumento} onChange={(event) => setTipoDocumento(event.target.value)}>
              <option value="CPF">CPF</option>
              <option value="CNPJ">CNPJ</option>
            </select>
          </Field>
        )}
        <Field label={mode === 'nome' ? 'Nome ou trecho do nome' : 'CPF ou CNPJ'}>
          <input value={query} onChange={(event) => setQuery(event.target.value)} required />
        </Field>
        <button className="primary" disabled={busy}>{busy ? 'Pesquisando…' : 'Pesquisar'}</button>
      </form>

      {error && <p className="error page-message" role="alert">{error}</p>}
      {busy && <p className="sr-only" role="status">Pesquisando proprietários…</p>}
      {results?.length === 0 && <p className="empty page-message" role="status">Nenhum proprietário encontrado.</p>}
      {results?.length > 0 && (
        <div className="table-wrap" role="region" aria-label="Resultados da pesquisa de proprietários" tabIndex={0}>
          <table className="data-table">
            <thead>
              <tr><th>Nome</th><th>Documento</th><th>Telefone</th><th>E-mail</th><th>Observações</th><th>Ações</th></tr>
            </thead>
            <tbody>
              {results.map((owner) => (
                <tr key={owner.id}>
                  <td>{owner.nome}</td>
                  <td>{owner.tipoDocumento} · {owner.documento}</td>
                  <td>{owner.telefone}</td>
                  <td>{owner.email}</td>
                  <td>{owner.observacoes || '—'}</td>
                  <td><button className="ghost" onClick={() => setEditing(owner)}>Editar</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {!results && !error && !busy && <p className="muted page-message">A busca é limitada aos proprietários autorizados pela API para sua empresa.</p>}

      {open && <NovoProprietario onClose={() => setOpen(false)} onDone={created} />}
      {editing && <EditarProprietario owner={editing} onClose={() => setEditing(null)} onDone={async () => { setEditing(null); show('Proprietário atualizado.'); await search(); }} />}
      {toast}
    </>
  );
}

function NovoProprietario({ onClose, onDone }) {
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const update = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const owner = await api.post('/proprietario', {
        tipoDocumento: form.tipoDocumento,
        documento: form.documento.trim(),
        nome: form.nome.trim(),
        telefone: form.telefone.trim(),
        email: form.email.trim(),
        observacoes: form.observacoes.trim() || null,
      });
      await onDone(owner);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title="Novo proprietário" onClose={onClose}>
      <form className="form" onSubmit={submit}>
        <Field label="Tipo de documento">
          <select value={form.tipoDocumento} onChange={update('tipoDocumento')}>
            <option value="CPF">Pessoa física (CPF)</option>
            <option value="CNPJ">Pessoa jurídica (CNPJ)</option>
          </select>
        </Field>
        <Field label={form.tipoDocumento}>
          <input value={form.documento} onChange={update('documento')} required maxLength={14} autoComplete="off" />
        </Field>
        <Field label={form.tipoDocumento === 'CPF' ? 'Nome' : 'Razão social / nome'}>
          <input value={form.nome} onChange={update('nome')} required maxLength={150} />
        </Field>
        <Field label="Telefone"><input value={form.telefone} onChange={update('telefone')} required maxLength={20} /></Field>
        <Field label="E-mail"><input type="email" value={form.email} onChange={update('email')} required maxLength={255} /></Field>
        <Field label="Observações (opcional)">
          <textarea rows={3} value={form.observacoes} onChange={update('observacoes')} />
        </Field>
        {error && <p className="error" role="alert">{error}</p>}
        <div className="row-end">
          <button type="button" className="ghost" onClick={onClose}>Cancelar</button>
          <button className="primary" disabled={busy}>{busy ? 'Salvando…' : 'Cadastrar'}</button>
        </div>
      </form>
    </Modal>
  );
}

function EditarProprietario({ owner, onClose, onDone }) {
  const [form, setForm] = useState({
    tipoDocumento: owner.tipoDocumento || 'CPF', documento: owner.documento || '', nome: owner.nome || '',
    telefone: owner.telefone || '', email: owner.email || '', observacoes: owner.observacoes || '',
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const update = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api.put(`/proprietario/${owner.id}`, {
        tipoDocumento: form.tipoDocumento,
        documento: form.documento.trim(),
        nome: form.nome.trim(),
        telefone: form.telefone.trim(),
        email: form.email.trim(),
        observacoes: form.observacoes.trim() || null,
      });
      await onDone();
    } catch (requestError) {
      setError(requestError.message);
      setBusy(false);
    }
  }

  return <Modal title={`Editar proprietário · ${owner.nome}`} onClose={onClose}>
    <form className="form" onSubmit={submit}>
      <Field label="Tipo de documento"><select value={form.tipoDocumento} onChange={update('tipoDocumento')}><option value="CPF">Pessoa física (CPF)</option><option value="CNPJ">Pessoa jurídica (CNPJ)</option></select></Field>
      <Field label={form.tipoDocumento}><input value={form.documento} onChange={update('documento')} required maxLength={14} autoComplete="off" /></Field>
      <Field label={form.tipoDocumento === 'CPF' ? 'Nome' : 'Razão social / nome'}><input value={form.nome} onChange={update('nome')} required maxLength={150} /></Field>
      <Field label="Telefone"><input value={form.telefone} onChange={update('telefone')} required maxLength={20} /></Field>
      <Field label="E-mail"><input type="email" value={form.email} onChange={update('email')} required maxLength={255} /></Field>
      <Field label="Observações (opcional)"><textarea rows={3} value={form.observacoes} onChange={update('observacoes')} /></Field>
      {error && <p className="error" role="alert">{error}</p>}
      <div className="row-end"><button type="button" className="ghost" onClick={onClose} disabled={busy}>Cancelar</button><button className="primary" disabled={busy}>{busy ? 'Salvando…' : 'Salvar alterações'}</button></div>
    </form>
  </Modal>;
}
