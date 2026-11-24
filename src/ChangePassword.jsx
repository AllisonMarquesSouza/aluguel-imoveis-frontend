import { useState } from 'react';
import { api } from './api.js';
import { passwordChangeIssue } from './password-data.js';
import { Field, Modal } from './ui.jsx';

const EMPTY = { senhaAtual: '', novaSenha: '', confirmacaoNovaSenha: '' };

export default function ChangePassword({ onClose, onDone }) {
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const update = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));

  async function submit(event) {
    event.preventDefault();
    const issue = passwordChangeIssue(form);
    if (issue) return setError(issue);

    setBusy(true);
    setError('');
    try {
      await api.patch('/usuario/senha', form);
      setForm(EMPTY);
      onDone();
    } catch (requestError) {
      setError(requestError.message);
      setBusy(false);
    }
  }

  return <Modal title="Alterar senha" onClose={onClose}>
    <form className="form" onSubmit={submit}>
      <Field label="Senha atual"><input type="password" value={form.senhaAtual} onChange={update('senhaAtual')} autoComplete="current-password" required maxLength={255} /></Field>
      <Field label="Nova senha" hint="Use de 12 a 255 caracteres e até 72 bytes em UTF-8."><input type="password" value={form.novaSenha} onChange={update('novaSenha')} autoComplete="new-password" required minLength={12} maxLength={255} /></Field>
      <Field label="Confirmar nova senha"><input type="password" value={form.confirmacaoNovaSenha} onChange={update('confirmacaoNovaSenha')} autoComplete="new-password" required minLength={12} maxLength={255} /></Field>
      {error && <p className="error" role="alert">{error}</p>}
      <div className="row-end">
        <button type="button" className="ghost" onClick={onClose} disabled={busy}>Cancelar</button>
        <button className="primary" disabled={busy}>{busy ? 'Salvando…' : 'Alterar senha'}</button>
      </div>
    </form>
  </Modal>;
}
