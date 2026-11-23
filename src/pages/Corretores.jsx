import { useState } from 'react';
import { api, multipart } from '../api.js';
import { Field, Modal, useToast } from '../ui.jsx';

const empty = { nome: '', email: '', senha: '', creci: '', telefone: '', whatsapp: '', apresentacao: '' };

export default function Corretores() {
  const [open, setOpen] = useState(false);
  const [toast, show] = useToast();

  return (
    <>
      <header className="page-head">
        <div>
          <h1>Equipe de corretores</h1>
          <p className="muted">Cadastro de corretores da imobiliária.</p>
        </div>
        <button className="primary" onClick={() => setOpen(true)}>Novo corretor</button>
      </header>

      <p className="notice" role="status">
        A lista e as ações de equipe só serão exibidas quando puderem ser limitadas à sua empresa. Você pode cadastrar novos corretores enquanto isso.
      </p>

      {open && <NovoCorretor onClose={() => setOpen(false)} onDone={() => { setOpen(false); show('Corretor cadastrado.'); }} />}
      {toast}
    </>
  );
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
      onDone();
    } catch (e) {
      setErr(e.message);
      setBusy(false);
    }
  }

  return (
    <Modal title="Novo corretor" onClose={onClose}>
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
