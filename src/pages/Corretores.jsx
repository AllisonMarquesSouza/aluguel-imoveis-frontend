import { useEffect, useMemo, useState } from 'react';
import { api, assetUrl, multipart } from '../api.js';
import { can, useAuth } from '../auth.jsx';
import { Field, Modal, initials, useToast } from '../ui.jsx';

const empty = { nome: '', email: '', senha: '', creci: '', telefone: '', whatsapp: '', apresentacao: '' };

export default function Corretores() {
  const { session } = useAuth();
  const isGestor = can(session, 'GESTOR');
  const [list, setList] = useState(null);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [toast, show] = useToast();

  const load = () => api.get('/corretor').then(setList).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);

  const shown = useMemo(() => {
    const s = q.trim().toLowerCase();
    return (list ?? []).filter((c) => !s || c.nome.toLowerCase().includes(s) || c.creci?.toLowerCase().includes(s));
  }, [list, q]);

  async function deactivate(c) {
    if (!confirm(`Desativar ${c.nome}? Ele deixa de aparecer na vitrine.`)) return;
    try {
      await api.patch(`/corretor/desativar/${c.id}`);
      show('Corretor desativado.');
      load();
    } catch (e) {
      show(e.status === 404 ? 'Esse corretor é de outra empresa.' : e.message, 'err');
    }
  }

  return (
    <>
      <header className="page-head">
        <div>
          <h1>Corretores</h1>
          <p className="muted">Corretores ativos visíveis no app.</p>
        </div>
        {isGestor && <button className="primary" onClick={() => setOpen(true)}>Novo corretor</button>}
      </header>

      <input className="search" placeholder="Buscar por nome ou CRECI" value={q} onChange={(e) => setQ(e.target.value)} />
      {error && <p className="error">{error}</p>}
      {list && shown.length === 0 && (
        <p className="empty">{q ? 'Nenhum corretor encontrado para essa busca.' : 'Nenhum corretor ativo ainda. Cadastre o primeiro.'}</p>
      )}

      <div className="grid">
        {shown.map((c) => (
          <article className="card broker" key={c.id}>
            <div className="broker-top">
              {c.fotoUrl ? <img src={assetUrl(c.fotoUrl)} alt="" /> : <span className="avatar big">{initials(c.nome)}</span>}
              <div>
                <h3>{c.nome}</h3>
                <small>CRECI {c.creci}</small>
              </div>
            </div>
            {c.empresa && <span className="pill">{c.empresa.nome}</span>}
            <p className="muted clamp">{c.apresentacao}</p>
            <div className="broker-foot">
              <a href={`mailto:${c.email}`}>{c.email}</a>
              <span>{c.whatsapp || c.telefone}</span>
            </div>
            {isGestor && <button className="ghost danger" onClick={() => deactivate(c)}>Desativar</button>}
          </article>
        ))}
      </div>

      {open && (
        <NovoCorretor
          onClose={() => setOpen(false)}
          onDone={() => { setOpen(false); show('Corretor cadastrado.'); load(); }}
        />
      )}
      {toast}
    </>
  );
}

function NovoCorretor({ onClose, onDone }) {
  const [f, setF] = useState(empty);
  const [foto, setFoto] = useState(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    if (!foto) return setErr('Escolha uma foto do corretor.');
    setBusy(true);
    setErr('');
    try {
      await api.form('POST', '/corretor', multipart(f, { foto }));
      onDone();
    } catch (e) {
      setErr(e.message);
      setBusy(false);
    }
  }

  return (
    <Modal title="Novo corretor" onClose={onClose}>
      <form onSubmit={submit} className="form two">
        <Field label="Nome"><input value={f.nome} onChange={set('nome')} required /></Field>
        <Field label="CRECI"><input value={f.creci} onChange={set('creci')} required /></Field>
        <Field label="E-mail"><input type="email" value={f.email} onChange={set('email')} required /></Field>
        <Field label="Senha" hint="Mínimo de 12 caracteres.">
          <input type="password" minLength={12} value={f.senha} onChange={set('senha')} required autoComplete="new-password" />
        </Field>
        <Field label="Telefone"><input value={f.telefone} onChange={set('telefone')} required /></Field>
        <Field label="WhatsApp"><input value={f.whatsapp} onChange={set('whatsapp')} required /></Field>
        <div className="span2">
          <Field label="Apresentação"><textarea rows={3} value={f.apresentacao} onChange={set('apresentacao')} required /></Field>
        </div>
        <div className="span2">
          <Field label="Foto" hint="JPEG, PNG ou WebP, até 1 MB.">
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
