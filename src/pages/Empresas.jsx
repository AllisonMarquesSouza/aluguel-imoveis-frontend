import { useCallback, useEffect, useState } from 'react';
import { api, assetUrl, multipart } from '../api.js';
import { Field, Modal, useToast } from '../ui.jsx';

const EMPTY_EMPRESA = {
  nome: '',
  razaoSocial: '',
  tipoDocumento: 'CNPJ',
  documento: '',
  creci: '',
  descricao: '',
  telefone: '',
  whatsapp: '',
  email: '',
  logradouro: '',
  numero: '',
  bairro: '',
  cep: '',
  cidadeBaseId: '',
  cidadesAtuacaoIds: [],
};

const EMPTY_CORRETOR = {
  nome: '',
  email: '',
  senha: '',
  creci: '',
  telefone: '',
  whatsapp: '',
  apresentacao: '',
};

const optionalText = (value) => value.trim() || null;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export default function Empresas() {
  const [companies, setCompanies] = useState(null);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(null);
  const [managingLogo, setManagingLogo] = useState(null);
  const [toast, show] = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    const [companyResult, cityResult] = await Promise.allSettled([
      api.get('/empresa'),
      api.get('/cidade'),
    ]);
    if (companyResult.status === 'fulfilled') setCompanies(companyResult.value);
    else setError(`Empresas: ${companyResult.reason.message}`);
    if (cityResult.status === 'fulfilled') setCities(cityResult.value);
    else setError((current) => [current, `Cidades: ${cityResult.reason.message}`].filter(Boolean).join(' '));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function editCompany(company) {
    setBusyId(company.id);
    setError('');
    try {
      setEditing(await api.get(`/empresa/${company.id}`));
    } catch (e) {
      setError(e.message);
    } finally {
      setBusyId(null);
    }
  }

  async function changeStatus(company) {
    const action = company.ativa ? 'inativar' : 'ativar';
    if (!confirm(`${action === 'inativar' ? 'Inativar' : 'Ativar'} ${company.nome}?`)) return;
    setBusyId(company.id);
    setError('');
    try {
      await api.patch(`/empresa/${company.ativa ? 'inactivate' : 'activate'}/${company.id}`);
      show(`Empresa ${company.ativa ? 'inativada' : 'ativada'}.`);
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusyId(null);
    }
  }

  function finish(message) {
    setCreating(false);
    setEditing(null);
    show(message);
    load();
  }

  async function finishLogo(message) {
    setManagingLogo(null);
    show(message);
    await load();
  }

  return (
    <>
      <header className="page-head">
        <div>
          <h1>Empresas</h1>
          <p className="muted">Administração global de imobiliárias e empresas autônomas.</p>
        </div>
        <div className="row-end">
          <button className="ghost" onClick={load} disabled={loading}>Atualizar</button>
          <button className="primary" onClick={() => setCreating(true)}>Nova empresa</button>
        </div>
      </header>

      {error && <p className="error page-message" role="alert">{error}</p>}
      {loading && <p className="muted page-message" role="status">Carregando empresas…</p>}
      {!loading && companies?.length === 0 && <p className="empty">Nenhuma empresa cadastrada.</p>}
      {companies?.length > 0 && (
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Empresa</th><th>Logomarca</th><th>Tipo</th><th>Documento</th><th>Cidades</th><th>Situação</th><th>Ações</th></tr></thead>
            <tbody>
              {companies.map((company) => (
                <tr key={company.id}>
                  <td><strong>{company.nome}</strong><small>{company.email}</small></td>
                  <td><div className="company-logo-cell">{company.logoMarcaUrl ? <img src={assetUrl(company.logoMarcaUrl)} alt={`Logomarca de ${company.nome}`} /> : <span className="muted">Sem logo</span>}<button className="ghost" onClick={() => setManagingLogo(company)}>Gerenciar</button></div></td>
                  <td>{company.tipo}</td>
                  <td>{company.tipoDocumento} · {company.documento}</td>
                  <td>{company.cidadesAtuacao?.map((city) => city.nome).join(', ') || '—'}</td>
                  <td><span className={`status-pill ${company.ativa ? 'active' : 'inactive'}`}>{company.ativa ? 'Ativa' : 'Inativa'}</span></td>
                  <td>
                    <div className="row-end">
                      <button className="ghost" onClick={() => editCompany(company)} disabled={busyId === company.id}>Editar</button>
                      <button className="ghost" onClick={() => changeStatus(company)} disabled={busyId === company.id}>
                        {busyId === company.id ? 'Salvando…' : company.ativa ? 'Inativar' : 'Ativar'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {creating && <EmpresaForm cities={cities} onClose={() => setCreating(false)} onDone={() => finish('Empresa cadastrada.')} />}
      {editing && <EditarEmpresa company={editing} cities={cities} onClose={() => setEditing(null)} onDone={() => finish('Empresa atualizada.')} />}
      {managingLogo && <CompanyLogoForm company={managingLogo} onClose={() => setManagingLogo(null)} onDone={finishLogo} />}
      {toast}
    </>
  );
}

function CompanyLogoForm({ company, onClose, onDone }) {
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const hasLogo = Boolean(company.logoMarcaUrl && company.logoImagemId);
  const incompleteLogo = Boolean(company.logoMarcaUrl) !== Boolean(company.logoImagemId);

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
    setBusy(true);
    setError('');
    try {
      const form = new FormData();
      form.append('arquivo', file);
      const method = hasLogo ? 'PUT' : 'POST';
      const path = hasLogo
        ? `/imagens/EMPRESA/${company.id}/${encodeURIComponent(company.logoImagemId)}`
        : `/imagens/EMPRESA/${company.id}`;
      await api.form(method, path, form);
      await onDone(hasLogo ? 'Logomarca substituída.' : 'Logomarca adicionada.');
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  }

  async function remove() {
    if (!hasLogo) return;
    if (!confirm(`Remover a logomarca de ${company.nome}?`)) return;
    setBusy(true);
    setError('');
    try {
      await api.delete(`/imagens/EMPRESA/${company.id}/${encodeURIComponent(company.logoImagemId)}`);
      await onDone('Logomarca removida.');
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  }

  return <Modal title={`Logomarca · ${company.nome}`} onClose={onClose}>
    <form className="form" onSubmit={submit}>
      {company.logoMarcaUrl && <img className="logo-preview" src={assetUrl(company.logoMarcaUrl)} alt={`Logomarca atual de ${company.nome}`} />}
      {incompleteLogo && <p className="error" role="alert">A API retornou informações incompletas da logomarca. Não é possível alterar a imagem com segurança.</p>}
      <Field label={hasLogo ? 'Nova imagem para substituição' : 'Logomarca (JPEG, PNG ou WebP; até 5 MB)'}>
        <input type="file" accept="image/jpeg,image/png,image/webp" disabled={busy || incompleteLogo} onChange={(event) => { const selected = event.target.files?.[0] || null; setFile(selected); setError(selected ? validate(selected) : ''); }} />
      </Field>
      {error && <p className="error" role="alert">{error}</p>}
      <div className="row-end">
        {hasLogo && <button type="button" className="ghost danger" disabled={busy} onClick={remove}>Remover logomarca</button>}
        <button type="button" className="ghost" onClick={onClose}>Cancelar</button>
        <button className="primary" disabled={busy || !file || incompleteLogo}>{busy ? 'Enviando…' : hasLogo ? 'Substituir' : 'Adicionar'}</button>
      </div>
    </form>
  </Modal>;
}

function EmpresaForm({ cities, onClose, onDone }) {
  const [kind, setKind] = useState('IMOBILIARIA');
  const [empresa, setEmpresa] = useState(EMPTY_EMPRESA);
  const [gestor, setGestor] = useState({ nomeGestor: '', emailGestor: '', senhaGestor: '' });
  const [corretor, setCorretor] = useState(EMPTY_CORRETOR);
  const [logo, setLogo] = useState(null);
  const [fotoCorretor, setFotoCorretor] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const updateEmpresa = (key) => (event) => setEmpresa((current) => ({ ...current, [key]: event.target.value }));
  const updateGestor = (key) => (event) => setGestor((current) => ({ ...current, [key]: event.target.value }));
  const updateCorretor = (key) => (event) => setCorretor((current) => ({ ...current, [key]: event.target.value }));

  function empresaDto() {
    return {
      nome: empresa.nome.trim(),
      razaoSocial: optionalText(empresa.razaoSocial),
      tipoDocumento: empresa.tipoDocumento,
      documento: empresa.documento.trim(),
      creci: optionalText(empresa.creci),
      descricao: optionalText(empresa.descricao),
      telefone: optionalText(empresa.telefone),
      whatsapp: optionalText(empresa.whatsapp),
      email: empresa.email.trim(),
      logradouro: optionalText(empresa.logradouro),
      numero: optionalText(empresa.numero),
      bairro: optionalText(empresa.bairro),
      cep: optionalText(empresa.cep),
      cidadeBaseId: empresa.cidadeBaseId ? Number(empresa.cidadeBaseId) : null,
      cidadesAtuacaoIds: empresa.cidadesAtuacaoIds.map(Number),
    };
  }

  async function submit(event) {
    event.preventDefault();
    if (!logo) return setError('Selecione a logomarca da empresa.');
    if (!empresa.cidadesAtuacaoIds.length) return setError('Selecione ao menos uma cidade de atuação.');
    if (kind === 'AUTONOMA' && !fotoCorretor) return setError('Selecione a foto do corretor.');

    setBusy(true);
    setError('');
    try {
      const body = kind === 'IMOBILIARIA'
        ? { ...gestor, empresa: empresaDto() }
        : { corretor, empresa: empresaDto() };
      const files = kind === 'IMOBILIARIA'
        ? { logoEmpresa: logo }
        : { logoEmpresa: logo, fotoCorretor };
      await api.form('POST', `/empresa/${kind === 'IMOBILIARIA' ? 'imobiliaria' : 'autonoma'}`, multipart(body, files));
      onDone();
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  }

  return (
    <Modal title="Nova empresa" onClose={onClose}>
      <form className="form two" onSubmit={submit}>
        <div className="span2">
          <Field label="Tipo de empresa">
            <select value={kind} onChange={(event) => setKind(event.target.value)}>
              <option value="IMOBILIARIA">Imobiliária</option>
              <option value="AUTONOMA">Corretor autônomo</option>
            </select>
          </Field>
        </div>
        <Field label="Nome"><input value={empresa.nome} onChange={updateEmpresa('nome')} required maxLength={150} /></Field>
        <Field label="Razão social"><input value={empresa.razaoSocial} onChange={updateEmpresa('razaoSocial')} maxLength={180} /></Field>
        <Field label="Tipo de documento">
          <select value={empresa.tipoDocumento} onChange={updateEmpresa('tipoDocumento')}>
            <option value="CNPJ">CNPJ</option><option value="CPF">CPF</option>
          </select>
        </Field>
        <Field label="Documento"><input value={empresa.documento} onChange={updateEmpresa('documento')} required maxLength={14} /></Field>
        <Field label="CRECI"><input value={empresa.creci} onChange={updateEmpresa('creci')} maxLength={30} /></Field>
        <Field label="E-mail da empresa"><input type="email" value={empresa.email} onChange={updateEmpresa('email')} required maxLength={255} /></Field>
        <Field label="Telefone"><input value={empresa.telefone} onChange={updateEmpresa('telefone')} maxLength={20} /></Field>
        <Field label="WhatsApp"><input value={empresa.whatsapp} onChange={updateEmpresa('whatsapp')} maxLength={20} /></Field>
        <Field label="Cidade-base (opcional)">
          <select value={empresa.cidadeBaseId} onChange={updateEmpresa('cidadeBaseId')}>
            <option value="">Sem cidade-base</option>
            {cities.map((city) => <option key={city.id} value={city.id}>{city.nome} · {city.uf}</option>)}
          </select>
        </Field>
        <Field label="Cidades de atuação" hint={cities.length ? 'Selecione uma ou mais cidades.' : 'Cadastre cidades em Cadastros auxiliares antes de criar a empresa.'}>
          <select multiple size={3} value={empresa.cidadesAtuacaoIds} onChange={(event) => setEmpresa((current) => ({
            ...current,
            cidadesAtuacaoIds: Array.from(event.target.selectedOptions, (option) => option.value),
          }))} required>
            {cities.map((city) => <option key={city.id} value={city.id}>{city.nome} · {city.uf}</option>)}
          </select>
        </Field>
        <Field label="CEP"><input value={empresa.cep} onChange={updateEmpresa('cep')} maxLength={8} /></Field>
        <Field label="Logradouro"><input value={empresa.logradouro} onChange={updateEmpresa('logradouro')} maxLength={180} /></Field>
        <Field label="Número"><input value={empresa.numero} onChange={updateEmpresa('numero')} maxLength={20} /></Field>
        <Field label="Bairro"><input value={empresa.bairro} onChange={updateEmpresa('bairro')} maxLength={100} /></Field>
        <div className="span2"><Field label="Descrição"><textarea rows={3} value={empresa.descricao} onChange={updateEmpresa('descricao')} /></Field></div>

        {kind === 'IMOBILIARIA' ? (
          <>
            <div className="span2"><h3>Conta inicial do gestor</h3></div>
            <Field label="Nome do gestor"><input value={gestor.nomeGestor} onChange={updateGestor('nomeGestor')} required maxLength={150} /></Field>
            <Field label="E-mail do gestor"><input type="email" value={gestor.emailGestor} onChange={updateGestor('emailGestor')} required maxLength={255} /></Field>
            <Field label="Senha do gestor" hint="Mínimo de 12 caracteres.">
              <input type="password" value={gestor.senhaGestor} onChange={updateGestor('senhaGestor')} required minLength={12} maxLength={255} autoComplete="new-password" />
            </Field>
          </>
        ) : (
          <>
            <div className="span2"><h3>Dados do corretor autônomo</h3></div>
            <Field label="Nome"><input value={corretor.nome} onChange={updateCorretor('nome')} required maxLength={150} /></Field>
            <Field label="E-mail"><input type="email" value={corretor.email} onChange={updateCorretor('email')} required maxLength={255} /></Field>
            <Field label="Senha" hint="Mínimo de 12 caracteres.">
              <input type="password" value={corretor.senha} onChange={updateCorretor('senha')} required minLength={12} maxLength={255} autoComplete="new-password" />
            </Field>
            <Field label="CRECI do corretor"><input value={corretor.creci} onChange={updateCorretor('creci')} required maxLength={30} /></Field>
            <Field label="Telefone"><input value={corretor.telefone} onChange={updateCorretor('telefone')} required maxLength={20} /></Field>
            <Field label="WhatsApp"><input value={corretor.whatsapp} onChange={updateCorretor('whatsapp')} required maxLength={20} /></Field>
            <div className="span2"><Field label="Apresentação"><textarea rows={3} value={corretor.apresentacao} onChange={updateCorretor('apresentacao')} required /></Field></div>
          </>
        )}

        <Field label="Logomarca da empresa"><input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setLogo(event.target.files[0] ?? null)} required /></Field>
        {kind === 'AUTONOMA' && <Field label="Foto do corretor"><input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setFotoCorretor(event.target.files[0] ?? null)} required /></Field>}
        {error && <p className="error span2" role="alert">{error}</p>}
        <div className="span2 row-end">
          <button type="button" className="ghost" onClick={onClose}>Cancelar</button>
          <button className="primary" disabled={busy}>{busy ? 'Salvando…' : 'Cadastrar empresa'}</button>
        </div>
      </form>
    </Modal>
  );
}

function EditarEmpresa({ company, cities, onClose, onDone }) {
  const [form, setForm] = useState({
    nome: company.nome ?? '',
    razaoSocial: company.razaoSocial ?? '',
    tipoDocumento: company.tipoDocumento ?? 'CNPJ',
    documento: company.documento ?? '',
    creci: company.creci ?? '',
    descricao: company.descricao ?? '',
    telefone: company.telefone ?? '',
    whatsapp: company.whatsapp ?? '',
    email: company.email ?? '',
    logradouro: company.logradouro ?? '',
    numero: company.numero ?? '',
    bairro: company.bairro ?? '',
    cep: company.cep ?? '',
    cidadeBaseId: company.cidadeBase?.id ? String(company.cidadeBase.id) : '',
    cidadesAtuacaoIds: (company.cidadesAtuacao ?? []).map((city) => String(city.id)),
  });
  const [logo, setLogo] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const update = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    const dto = {
      tipo: company.tipo,
      nome: optionalText(form.nome),
      razaoSocial: optionalText(form.razaoSocial),
      tipoDocumento: form.tipoDocumento || null,
      documento: optionalText(form.documento),
      creci: optionalText(form.creci),
      descricao: optionalText(form.descricao),
      telefone: optionalText(form.telefone),
      whatsapp: optionalText(form.whatsapp),
      email: optionalText(form.email),
      logradouro: optionalText(form.logradouro),
      numero: optionalText(form.numero),
      bairro: optionalText(form.bairro),
      cep: optionalText(form.cep),
      cidadeBaseId: form.cidadeBaseId ? Number(form.cidadeBaseId) : null,
      cidadesAtuacaoIds: form.cidadesAtuacaoIds.map(Number),
    };
    try {
      await api.form('PUT', `/empresa/${company.id}`, multipart(dto, logo ? { logoEmpresa: logo } : {}));
      onDone();
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  }

  return (
    <Modal title={`Editar ${company.nome}`} onClose={onClose}>
      <form className="form two" onSubmit={submit}>
        <p className="muted span2">Campos opcionais vazios são ignorados pela API. A lista de cidades de atuação pode ser limpa.</p>
        <Field label="Nome"><input value={form.nome} onChange={update('nome')} maxLength={150} /></Field>
        <Field label="Razão social"><input value={form.razaoSocial} onChange={update('razaoSocial')} maxLength={180} /></Field>
        <Field label="Tipo de documento"><select value={form.tipoDocumento} onChange={update('tipoDocumento')}><option value="CNPJ">CNPJ</option><option value="CPF">CPF</option></select></Field>
        <Field label="Documento"><input value={form.documento} onChange={update('documento')} maxLength={14} /></Field>
        <Field label="CRECI"><input value={form.creci} onChange={update('creci')} maxLength={30} /></Field>
        <Field label="E-mail"><input type="email" value={form.email} onChange={update('email')} maxLength={255} /></Field>
        <Field label="Telefone"><input value={form.telefone} onChange={update('telefone')} maxLength={20} /></Field>
        <Field label="WhatsApp"><input value={form.whatsapp} onChange={update('whatsapp')} maxLength={20} /></Field>
        <Field label="Cidade-base">
          <select value={form.cidadeBaseId} onChange={update('cidadeBaseId')}>
            <option value="">Manter cidade-base atual</option>
            {cities.map((city) => <option key={city.id} value={city.id}>{city.nome} · {city.uf}</option>)}
          </select>
        </Field>
        <Field label="Cidades de atuação">
          <select multiple size={3} value={form.cidadesAtuacaoIds} onChange={(event) => setForm((current) => ({
            ...current,
            cidadesAtuacaoIds: Array.from(event.target.selectedOptions, (option) => option.value),
          }))}>
            {cities.map((city) => <option key={city.id} value={city.id}>{city.nome} · {city.uf}</option>)}
          </select>
        </Field>
        <Field label="CEP"><input value={form.cep} onChange={update('cep')} maxLength={8} /></Field>
        <Field label="Logradouro"><input value={form.logradouro} onChange={update('logradouro')} maxLength={180} /></Field>
        <Field label="Número"><input value={form.numero} onChange={update('numero')} maxLength={20} /></Field>
        <Field label="Bairro"><input value={form.bairro} onChange={update('bairro')} maxLength={100} /></Field>
        <div className="span2"><Field label="Descrição"><textarea rows={3} value={form.descricao} onChange={update('descricao')} /></Field></div>
        <div className="span2"><Field label="Substituir logomarca (opcional)"><input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setLogo(event.target.files[0] ?? null)} /></Field></div>
        {error && <p className="error span2" role="alert">{error}</p>}
        <div className="span2 row-end">
          <button type="button" className="ghost" onClick={onClose}>Cancelar</button>
          <button className="primary" disabled={busy}>{busy ? 'Salvando…' : 'Salvar alterações'}</button>
        </div>
      </form>
    </Modal>
  );
}
