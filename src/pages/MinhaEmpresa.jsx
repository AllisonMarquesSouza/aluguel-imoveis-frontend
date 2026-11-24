import { useCallback, useEffect, useState } from 'react';
import { api, assetUrl } from '../api.js';
import { Field, useToast } from '../ui.jsx';

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export default function MinhaEmpresa() {
  const [company, setCompany] = useState(null);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [toast, show] = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setCompany(await api.get('/empresa/atual'));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function validate(selected) {
    if (!selected) return 'Selecione uma imagem.';
    if (!IMAGE_TYPES.has(selected.type)) return 'Use uma imagem JPEG, PNG ou WebP.';
    if (selected.size > MAX_IMAGE_SIZE) return 'A imagem pode ter no máximo 5 MB.';
    return '';
  }

  async function submit(event) {
    event.preventDefault();
    const issue = validate(file);
    if (issue) return setError(issue);
    if (!company?.id) return setError('A API não retornou a empresa vinculada à sessão.');
    const hasLogo = Boolean(company.logoMarcaUrl && company.logoImagemId);
    if (Boolean(company.logoMarcaUrl) !== Boolean(company.logoImagemId)) return setError('A API retornou informações incompletas da logomarca.');
    setBusy(true);
    setError('');
    try {
      const form = new FormData();
      form.append('arquivo', file);
      const path = hasLogo
        ? `/imagens/EMPRESA/${company.id}/${encodeURIComponent(company.logoImagemId)}`
        : `/imagens/EMPRESA/${company.id}`;
      await api.form(hasLogo ? 'PUT' : 'POST', path, form);
      setFile(null);
      show(hasLogo ? 'Logomarca substituída.' : 'Logomarca adicionada.');
      await load();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!company?.id || !company.logoImagemId) return;
    if (!confirm(`Remover a logomarca de ${company.nome}?`)) return;
    setBusy(true);
    setError('');
    try {
      await api.delete(`/imagens/EMPRESA/${company.id}/${encodeURIComponent(company.logoImagemId)}`);
      show('Logomarca removida.');
      await load();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  const hasLogo = Boolean(company?.logoMarcaUrl && company?.logoImagemId);
  const incompleteLogo = Boolean(company?.logoMarcaUrl) !== Boolean(company?.logoImagemId);

  return <>
    <header className="page-head">
      <div><h1>Minha empresa</h1><p className="muted">Consulte o contexto da empresa vinculada à sua sessão e gerencie sua logomarca.</p></div>
      <button className="ghost" onClick={load} disabled={loading}>Atualizar</button>
    </header>
    {error && <div className="request-state"><p className="error" role="alert">{error}</p><button className="ghost" onClick={load}>Tentar novamente</button></div>}
    {loading && <p className="muted page-message" role="status">Carregando empresa…</p>}
    {!loading && company && <div className="split">
      <section className="card">
        <h2>{company.nome}</h2>
        <dl className="detail-grid"><div><dt>Tipo</dt><dd>{company.tipo}</dd></div><div><dt>Identificador</dt><dd>{company.id}</dd></div></dl>
      </section>
      <section className="card">
        <h2>Logomarca</h2>
        {company.logoMarcaUrl ? <img className="logo-preview" src={assetUrl(company.logoMarcaUrl)} alt={`Logomarca de ${company.nome}`} /> : <p className="muted">Nenhuma logomarca cadastrada.</p>}
        {incompleteLogo && <p className="error" role="alert">A API retornou informações incompletas da logomarca. Não é possível alterá-la com segurança.</p>}
        <form className="form" onSubmit={submit}>
          <Field label={hasLogo ? 'Nova imagem para substituição' : 'Imagem JPEG, PNG ou WebP; até 5 MB'}>
            <input type="file" accept="image/jpeg,image/png,image/webp" disabled={busy || incompleteLogo} onChange={(event) => { const selected = event.target.files?.[0] || null; setFile(selected); setError(selected ? validate(selected) : ''); }} />
          </Field>
          <div className="row-end">
            {hasLogo && <button type="button" className="ghost danger" disabled={busy} onClick={remove}>Remover logomarca</button>}
            <button className="primary" disabled={busy || !file || incompleteLogo}>{busy ? 'Enviando…' : hasLogo ? 'Substituir' : 'Adicionar'}</button>
          </div>
        </form>
      </section>
    </div>}
    {toast}
  </>;
}
