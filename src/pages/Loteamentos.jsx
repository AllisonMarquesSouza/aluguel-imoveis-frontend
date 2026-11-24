import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { Field, Modal, useToast } from '../ui.jsx';

const emptyDevelopment = {
  nome: '', incorporadora: '', cidadeId: '', asfalto: false, agua: false, energia: false,
  esgoto: false, iluminacaoPublica: false, areasLazer: '',
};

const infrastructure = [
  ['asfalto', 'Asfalto'], ['agua', 'Água'], ['energia', 'Energia'],
  ['esgoto', 'Esgoto'], ['iluminacaoPublica', 'Iluminação pública'],
];

export default function Loteamentos() {
  const { session } = useAuth();
  const isManager = session?.perfil === 'GESTOR';
  const [developments, setDevelopments] = useState(null);
  const [properties, setProperties] = useState(null);
  const [lotsByBlock, setLotsByBlock] = useState({});
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [quadraDevelopment, setQuadraDevelopment] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [editingLot, setEditingLot] = useState(null);
  const [toast, show] = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    const [developmentResult, propertyResult, cityResult] = await Promise.allSettled([
      api.get('/loteamento'), isManager ? Promise.resolve([]) : api.get('/imovel'),
      isManager ? Promise.resolve([]) : api.get('/cidade/empresa'),
    ]);
    const failures = [];
    if (developmentResult.status === 'fulfilled' && Array.isArray(developmentResult.value)) setDevelopments(developmentResult.value);
    else failures.push(`Loteamentos: ${developmentResult.status === 'rejected' ? developmentResult.reason.message : 'formato inesperado da API.'}`);
    if (propertyResult.status === 'fulfilled' && Array.isArray(propertyResult.value)) setProperties(propertyResult.value);
    else failures.push(`Lotes: ${propertyResult.status === 'rejected' ? propertyResult.reason.message : 'formato inesperado da API.'}`);
    if (cityResult.status === 'fulfilled' && Array.isArray(cityResult.value)) setCities(cityResult.value);
    else failures.push(`Cidades: ${cityResult.status === 'rejected' ? cityResult.reason.message : 'formato inesperado da API.'}`);
    if (isManager && developmentResult.status === 'fulfilled' && Array.isArray(developmentResult.value)) {
      const entries = developmentResult.value.flatMap((development) => (development.quadras || []).map((quadra) => [
        quadra.id,
        api.get(`/loteamento/${development.id}/quadras/${quadra.id}/lotes`),
      ]));
      const results = await Promise.allSettled(entries.map(([, request]) => request));
      const nextLots = {};
      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && Array.isArray(result.value)) nextLots[entries[index][0]] = result.value;
        else failures.push(`Lotes da quadra ${entries[index][0]}: ${result.status === 'rejected' ? result.reason.message : 'formato inesperado da API.'}`);
      });
      setLotsByBlock(nextLots);
    }
    setError(failures.join(' '));
    setLoading(false);
  }, [isManager]);

  useEffect(() => { load(); }, [load]);

  async function developmentSaved() {
    setCreating(false);
    show('Loteamento cadastrado.');
    await load();
  }

  async function blockSaved() {
    setQuadraDevelopment(null);
    show('Quadra cadastrada. As contagens serão atualizadas pela API.');
    await load();
  }

  function lotsFor(quadra) {
    if (isManager) return lotsByBlock[quadra.id] || [];
    return (properties || []).filter((property) => property.natureza === 'LOTE'
      && Number(property.lote?.quadra?.id) === Number(quadra.id));
  }

  async function lotSaved() {
    setEditingLot(null);
    show('Situação do lote atualizada.');
    await load();
  }

  return (
    <>
      <header className="page-head">
        <div><h1>Loteamentos</h1><p className="muted">Consulte loteamentos, quadras e lotes da sua empresa.</p></div>
        <div className="row-end"><button className="ghost" onClick={load} disabled={loading}>Atualizar</button>{!isManager && <button className="primary" onClick={() => setCreating(true)}>Novo loteamento</button>}</div>
      </header>
      {error && <div className="request-state"><p className="error" role="alert">{error}</p><button className="ghost" onClick={load}>Tentar novamente</button></div>}
      {loading && <p className="muted page-message" role="status">Carregando loteamentos…</p>}
      {!loading && developments?.length === 0 && <p className="empty" role="status">Nenhum loteamento cadastrado nesta empresa.</p>}

      {developments?.length > 0 && <div className="development-list">
        {developments.map((development) => (
          <section className="card development-card" key={development.id}>
            <header className="development-head">
              <div><h2>{development.nome}</h2><p className="muted">{development.incorporadora} · {development.cidade} · {development.uf}</p></div>
              <div className="row-end">
                <button className="ghost" onClick={() => setExpanded(expanded === development.id ? null : development.id)} aria-expanded={expanded === development.id}>{expanded === development.id ? 'Ocultar detalhes' : 'Ver detalhes'}</button>
                {!isManager && <button className="primary" onClick={() => setQuadraDevelopment(development)}>Nova quadra</button>}
              </div>
            </header>
            {expanded === development.id && <div className="development-details">
              <p><strong>Infraestrutura:</strong> {infrastructure.filter(([key]) => development[key]).map(([, label]) => label).join(', ') || 'Não informada'}</p>
              {development.areasLazer && <p><strong>Áreas de lazer:</strong> {development.areasLazer}</p>}
            </div>}
            {!development.quadras?.length && <p className="muted" role="status">Nenhuma quadra cadastrada.</p>}
            {development.quadras?.length > 0 && <div className="block-list">
              {development.quadras.map((quadra) => {
                const lots = lotsFor(quadra);
                return <article className="block-card" key={quadra.id}>
                  <div className="block-head">
                    <div><h3>Quadra {quadra.identificacao}</h3><p className="muted">Contagens informadas pela API</p></div>
                    <div className="block-counts"><span><strong>{quadra.lotesDisponiveis}</strong> disponíveis</span><span><strong>{quadra.lotesVendidos}</strong> vendidos</span></div>
                    {!isManager && <Link className="ghost button-link" to={`/imoveis?natureza=LOTE&quadraId=${quadra.id}`}>Cadastrar lote</Link>}
                  </div>
                  {lots.length > 0 ? <div className="lot-list">
                    {lots.map((lot) => <div className="lot-row" key={lot.id}><strong>Lote {isManager ? lot.numero : lot.lote?.numero}</strong><span>{isManager ? `Quadra ${lot.quadra?.identificacao || quadra.identificacao}` : `${lot.codigo} · ${lot.nomeProprietario || 'Proprietário não informado'}`}</span><span className={`status-pill ${lot.situacao === 'DISPONIVEL' ? 'active' : 'inactive'}`}>{lot.situacao || '—'}</span>{isManager && <button className="ghost" onClick={() => setEditingLot(lot)}>Alterar situação</button>}</div>)}
                  </div> : <p className="muted" role="status">A lista de lotes deste acervo não retornou registros para esta quadra.</p>}
                </article>;
              })}
            </div>}
          </section>
        ))}
      </div>}

      {creating && <NewDevelopmentForm cities={cities} onClose={() => setCreating(false)} onDone={developmentSaved} />}
      {quadraDevelopment && <NewBlockForm development={quadraDevelopment} onClose={() => setQuadraDevelopment(null)} onDone={blockSaved} />}
      {editingLot && <EditLotStatus lot={editingLot} onClose={() => setEditingLot(null)} onDone={lotSaved} />}
      {toast}
    </>
  );
}

function EditLotStatus({ lot, onClose, onDone }) {
  const [situacao, setSituacao] = useState(lot.situacao || 'DISPONIVEL');
  const [observacao, setObservacao] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api.patch(`/lote/${lot.id}/situacao`, { situacao, observacao: observacao.trim() });
      await onDone();
    } catch (requestError) {
      setError(requestError.message);
      setBusy(false);
    }
  }

  return <Modal title={`Situação · Lote ${lot.numero}`} onClose={onClose}>
    <form className="form" onSubmit={submit}>
      <Field label="Situação"><select value={situacao} onChange={(event) => setSituacao(event.target.value)}><option value="DISPONIVEL">Disponível</option><option value="RESERVADO">Reservado</option><option value="VENDIDO">Vendido</option><option value="ALUGADO">Alugado</option></select></Field>
      <Field label="Observação" hint="Obrigatória para registrar a alteração; até 2.000 caracteres."><textarea rows={4} value={observacao} onChange={(event) => setObservacao(event.target.value)} maxLength={2000} required /></Field>
      {error && <p className="error" role="alert">{error}</p>}
      <div className="row-end"><button type="button" className="ghost" onClick={onClose} disabled={busy}>Cancelar</button><button className="primary" disabled={busy || situacao === lot.situacao}>{busy ? 'Salvando…' : 'Atualizar situação'}</button></div>
    </form>
  </Modal>;
}

function NewDevelopmentForm({ cities, onClose, onDone }) {
  const [form, setForm] = useState(emptyDevelopment);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const update = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api.post('/loteamento', {
        nome: form.nome.trim(), incorporadora: form.incorporadora.trim(), cidadeId: Number(form.cidadeId),
        asfalto: form.asfalto, agua: form.agua, energia: form.energia, esgoto: form.esgoto,
        iluminacaoPublica: form.iluminacaoPublica, areasLazer: form.areasLazer.trim() || null,
      });
      await onDone();
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  }

  return <Modal title="Novo loteamento" onClose={onClose}>
    <form className="form two" onSubmit={submit}>
      <div className="span2 inline-notice">A API vincula o loteamento à empresa da sessão e valida a cidade pela área de atuação.</div>
      <div className="span2"><Field label="Nome"><input value={form.nome} onChange={update('nome')} required maxLength={180} /></Field></div>
      <div className="span2"><Field label="Incorporadora"><input value={form.incorporadora} onChange={update('incorporadora')} required maxLength={180} /></Field></div>
      <div className="span2"><Field label="Cidade"><select value={form.cidadeId} onChange={update('cidadeId')} required><option value="">Selecione</option>{cities.map((city) => <option key={city.id} value={city.id}>{city.nome} · {city.uf}</option>)}</select></Field></div>
      {infrastructure.map(([key, label]) => <BooleanField key={key} label={label} value={form[key]} onChange={update(key)} />)}
      <div className="span2"><Field label="Áreas de lazer (opcional)"><textarea value={form.areasLazer} onChange={update('areasLazer')} maxLength={4000} /></Field></div>
      {error && <p className="error span2" role="alert">{error}</p>}
      <div className="row-end span2"><button type="button" className="ghost" onClick={onClose}>Cancelar</button><button className="primary" disabled={busy}>{busy ? 'Cadastrando…' : 'Cadastrar loteamento'}</button></div>
    </form>
  </Modal>;
}

function NewBlockForm({ development, onClose, onDone }) {
  const [identificacao, setIdentificacao] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api.post(`/loteamento/${development.id}/quadras`, { identificacao: identificacao.trim() });
      await onDone();
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  }

  return <Modal title={`Nova quadra · ${development.nome}`} onClose={onClose}>
    <form className="form" onSubmit={submit}>
      <Field label="Identificação da quadra"><input value={identificacao} onChange={(event) => setIdentificacao(event.target.value)} maxLength={50} required autoFocus /></Field>
      {error && <p className="error" role="alert">{error}</p>}
      <div className="row-end"><button type="button" className="ghost" onClick={onClose}>Cancelar</button><button className="primary" disabled={busy}>{busy ? 'Cadastrando…' : 'Cadastrar quadra'}</button></div>
    </form>
  </Modal>;
}

function BooleanField({ label, value, onChange }) {
  return <Field label={label}><select value={String(value)} onChange={(event) => onChange({ target: { value: event.target.value === 'true' } })}><option value="false">Não</option><option value="true">Sim</option></select></Field>;
}
