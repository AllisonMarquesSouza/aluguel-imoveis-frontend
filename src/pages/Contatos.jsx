import { useCallback, useEffect, useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { buildContactQuery } from '../contact-data.js';
import { Field, Modal, useToast } from '../ui.jsx';

const RETURNS = [
  ['FALEI', 'Falei'],
  ['VISITA_AGENDADA', 'Visita agendada'],
  ['SEM_RESPOSTA', 'Sem resposta'],
  ['DESCARTADO', 'Descartado'],
];
const CHANNELS = { WHATSAPP: 'WhatsApp', TELEFONE: 'Telefone', EMAIL: 'E-mail' };

export default function Contatos() {
  const { session } = useAuth();
  const isBroker = session?.perfil === 'CORRETOR';
  const [filters, setFilters] = useState({ imovelId: '', dataInicio: '', dataFim: '' });
  const [contacts, setContacts] = useState(null);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [propertyError, setPropertyError] = useState('');
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);
  const [toast, show] = useToast();

  const load = useCallback(async (nextFilters) => {
    setLoading(true);
    setError('');
    try {
      const query = buildContactQuery(nextFilters);
      const response = await api.get(`/contatos${query}`);
      if (!Array.isArray(response)) throw new Error('A API retornou os contatos em formato inesperado.');
      setContacts(response);
    } catch (requestError) {
      setError(requestError.message);
      setContacts(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    api.get('/imovel').then((result) => {
      if (!Array.isArray(result)) throw new Error('A API retornou os imóveis em formato inesperado.');
      setProperties(result);
    }).catch((requestError) => setPropertyError(requestError.message));
  }, []);
  useEffect(() => { load({ imovelId: '', dataInicio: '', dataFim: '' }); }, [load]);

  function changeFilter(key) {
    return (event) => setFilters((current) => ({ ...current, [key]: event.target.value }));
  }

  async function submitFilters(event) {
    event.preventDefault();
    if (filters.dataInicio && filters.dataFim && filters.dataInicio > filters.dataFim) {
      setError('A data inicial não pode ser posterior à data final.');
      return;
    }
    await load(filters);
  }

  async function savedReturn() {
    setEditing(null);
    show('Retorno do contato atualizado.');
    await load(filters);
  }

  return <>
    <header className="page-head">
      <div><h1>Contatos de imóveis</h1><p className="muted">A caixa exibe os contatos do seu escopo, em ordem da API.</p></div>
      <button className="ghost" onClick={() => load(filters)} disabled={loading}>Atualizar</button>
    </header>

    <form className="card search-form contact-filters" onSubmit={submitFilters} aria-busy={loading}>
      <Field label="Imóvel"><select value={filters.imovelId} onChange={changeFilter('imovelId')}><option value="">Todos os imóveis</option>{properties.map((property) => <option key={property.id} value={property.id}>{property.codigo} · {property.titulo}</option>)}</select></Field>
      <Field label="De"><input type="date" value={filters.dataInicio} onChange={changeFilter('dataInicio')} /></Field>
      <Field label="Até"><input type="date" value={filters.dataFim} onChange={changeFilter('dataFim')} /></Field>
      <button className="primary" disabled={loading}>{loading ? 'Consultando…' : 'Filtrar'}</button>
    </form>
    {propertyError && <p className="muted" role="status">Não foi possível carregar a lista de imóveis para filtrar: {propertyError}</p>}
    {error && <div className="request-state"><p className="error" role="alert">{error}</p><button className="ghost" onClick={() => load(filters)}>Tentar novamente</button></div>}
    {loading && <p className="muted page-message" role="status">Carregando contatos…</p>}
    {!loading && !error && contacts?.length === 0 && <p className="empty" role="status">Nenhum contato encontrado para estes filtros.</p>}
    {contacts?.length > 0 && <div className="table-wrap" role="region" aria-label="Contatos recebidos" tabIndex={0}>
      <table className="data-table">
        <thead><tr><th>Data</th><th>Imóvel</th><th>Corretor</th><th>Canal</th><th>Retorno</th>{isBroker && <th>Ações</th>}</tr></thead>
        <tbody>{contacts.map((contact) => <tr key={contact.id}>
          <td>{contact.criadoEm ? new Date(contact.criadoEm).toLocaleString('pt-BR') : '—'}</td>
          <td><strong>{contact.imovelCodigo}</strong><small>{contact.imovelTitulo}</small></td>
          <td>{contact.corretorNome}</td>
          <td>{CHANNELS[contact.canal] || contact.canal}</td>
          <td><span className={`status-pill ${contact.retorno ? 'active' : 'inactive'}`}>{returnLabel(contact.retorno)}</span></td>
          {isBroker && <td><button className="ghost" onClick={() => setEditing(contact)}>Registrar retorno</button></td>}
        </tr>)}</tbody>
      </table>
    </div>}
    {!isBroker && <p className="notice" role="status">O gestor consulta os contatos da empresa. A API reserva a alteração do retorno ao corretor responsável.</p>}
    {editing && <ContactReturnForm contact={editing} onClose={() => setEditing(null)} onDone={savedReturn} />}
    {toast}
  </>;
}

function returnLabel(value) {
  if (!value) return 'Sem retorno';
  return RETURNS.find(([status]) => status === value)?.[1] || value;
}

function ContactReturnForm({ contact, onClose, onDone }) {
  const [retorno, setRetorno] = useState(contact.retorno || '');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api.patch(`/contatos/${contact.id}/retorno`, { retorno });
      await onDone();
    } catch (requestError) {
      setError(requestError.message);
      setBusy(false);
    }
  }

  return <Modal title={`Registrar retorno · ${contact.imovelCodigo}`} onClose={onClose}>
    <form className="form" onSubmit={submit}>
      <p className="muted">Escolha a situação de atendimento e salve para registrar o retorno na API.</p>
      <Field label="Retorno"><select value={retorno} onChange={(event) => setRetorno(event.target.value)} required><option value="" disabled>Selecione um retorno</option>{RETURNS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field>
      {error && <p className="error" role="alert">{error}</p>}
      <div className="row-end"><button type="button" className="ghost" onClick={onClose} disabled={busy}>Cancelar</button><button className="primary" disabled={busy}>{busy ? 'Salvando…' : 'Salvar retorno'}</button></div>
    </form>
  </Modal>;
}
