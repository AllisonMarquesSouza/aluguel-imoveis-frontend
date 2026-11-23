import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api, assetUrl, multipart } from '../api.js';
import { buildPropertyDto } from '../property-data.js';
import { Field, Modal, useToast } from '../ui.jsx';

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

const emptyForm = {
  codigo: '', titulo: '', proprietarioId: '', finalidade: 'VENDA', valorVenda: '', valorAluguel: '',
  valorCondominio: '', valorIptu: '', descricao: '', cep: '', logradouro: '', numero: '',
  complemento: '', bairro: '', cidadeId: '', latitude: '', longitude: '',
  areaTerreno: '', areaConstruida: '', quartos: '0', suites: '0', banheiros: '0', salas: '0',
  vagas: '0', pavimentos: '1', anoConstrucao: '0', piscina: false, quintal: false,
  churrasqueira: false, mobiliada: false, areaTotal: '', frente: '', fundo: '', lateralEsquerda: '',
  lateralDireita: '', topografia: 'PLANO', muro: false, esquina: false, usoPermitido: '',
  predioId: '', andar: '0', numeroUnidade: '', areaPrivativa: '', varanda: false,
  posicaoSolar: '', quadraId: '', numeroLote: '', areaLote: '', frenteLote: '', fundoLote: '',
  condicoesParcelamento: '',
};

const natureLabel = {
  CASA: 'Casa', TERRENO: 'Terreno', APARTAMENTO: 'Apartamento', LOTE: 'Lote',
};

const money = (value) => value == null
  ? '—'
  : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

function fileIssue(file) {
  if (!file) return '';
  if (!IMAGE_TYPES.has(file.type)) return 'Use uma imagem JPEG, PNG ou WebP.';
  if (file.size > MAX_IMAGE_SIZE) return 'Cada imagem pode ter no máximo 5 MB.';
  return '';
}

function propertyAddressLabel(property) {
  const address = property.endereco;
  if (!address) return property.apartamento?.predio?.endereco?.cidade || '—';
  return [address.bairro, address.cidade, address.uf].filter(Boolean).join(' · ') || '—';
}

export default function Imoveis() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [properties, setProperties] = useState(null);
  const [buildings, setBuildings] = useState(null);
  const [cities, setCities] = useState([]);
  const [features, setFeatures] = useState([]);
  const [developments, setDevelopments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [creatingProperty, setCreatingProperty] = useState(false);
  const [creatingBuilding, setCreatingBuilding] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [toast, show] = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    const results = await Promise.allSettled([
      api.get('/imovel'), api.get('/predio'), api.get('/cidade'),
      api.get('/caracteristica'), api.get('/loteamento'),
    ]);
    const failures = [];
    const [propertyResult, buildingResult, cityResult, featureResult, developmentResult] = results;
    if (propertyResult.status === 'fulfilled' && Array.isArray(propertyResult.value)) setProperties(propertyResult.value);
    else failures.push(`Imóveis: ${propertyResult.status === 'rejected' ? propertyResult.reason.message : 'formato inesperado da API.'}`);
    if (buildingResult.status === 'fulfilled' && Array.isArray(buildingResult.value)) setBuildings(buildingResult.value);
    else failures.push(`Prédios: ${buildingResult.status === 'rejected' ? buildingResult.reason.message : 'formato inesperado da API.'}`);
    if (cityResult.status === 'fulfilled' && Array.isArray(cityResult.value)) setCities(cityResult.value);
    else failures.push(`Cidades: ${cityResult.status === 'rejected' ? cityResult.reason.message : 'formato inesperado da API.'}`);
    if (featureResult.status === 'fulfilled' && Array.isArray(featureResult.value)) setFeatures(featureResult.value);
    else failures.push(`Características: ${featureResult.status === 'rejected' ? featureResult.reason.message : 'formato inesperado da API.'}`);
    if (developmentResult.status === 'fulfilled' && Array.isArray(developmentResult.value)) setDevelopments(developmentResult.value);
    else failures.push(`Loteamentos: ${developmentResult.status === 'rejected' ? developmentResult.reason.message : 'formato inesperado da API.'}`);
    setError(failures.join(' '));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (!loading && searchParams.get('natureza') === 'LOTE') setCreatingProperty(true);
  }, [loading, searchParams]);

  async function showProperty(property) {
    setError('');
    try {
      setSelectedProperty(await api.get(`/imovel/${property.id}`));
    } catch (e) {
      setError(e.message);
    }
  }

  async function showBuilding(building) {
    setError('');
    try {
      setSelectedBuilding(await api.get(`/predio/${building.id}`));
    } catch (e) {
      setError(e.message);
    }
  }

  async function propertySaved() {
    setCreatingProperty(false);
    navigate('/imoveis', { replace: true });
    show('Imóvel cadastrado. Os dados exibidos vêm da API.');
    await load();
  }

  async function buildingSaved() {
    setCreatingBuilding(false);
    show('Prédio cadastrado.');
    await load();
  }

  return (
    <>
      <header className="page-head">
        <div>
          <h1>Imóveis</h1>
          <p className="muted">Acervo e prédios disponíveis para a sua empresa, conforme a API.</p>
        </div>
        <div className="row-end">
          <button className="ghost" onClick={load} disabled={loading}>Atualizar</button>
          <button className="ghost" onClick={() => setCreatingBuilding(true)}>Novo prédio</button>
          <button className="primary" onClick={() => setCreatingProperty(true)}>Novo imóvel</button>
        </div>
      </header>

      {error && <div className="request-state"><p className="error" role="alert">{error}</p><button className="ghost" onClick={load}>Tentar novamente</button></div>}
      {loading && <p className="muted page-message" role="status">Carregando acervo…</p>}

      <section className="card management-section" aria-labelledby="property-list-title">
        <div className="section-head"><div><h2 id="property-list-title">Acervo de imóveis</h2><p className="muted">Status e publicação são apresentados como retornados pela API.</p></div></div>
        {!loading && properties?.length === 0 && <p className="empty">Nenhum imóvel cadastrado nesta empresa.</p>}
        {properties?.length > 0 && (
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr><th>Código e título</th><th>Natureza</th><th>Proprietário</th><th>Localidade</th><th>Situação</th><th>Publicação</th><th>Ação</th></tr></thead>
              <tbody>{properties.map((property) => (
                <tr key={property.id}>
                  <td><strong>{property.codigo}</strong><small>{property.titulo}</small></td>
                  <td>{natureLabel[property.natureza] || property.natureza}</td>
                  <td>{property.nomeProprietario || '—'}</td>
                  <td>{propertyAddressLabel(property)}</td>
                  <td><span className={`status-pill ${property.situacao === 'DISPONIVEL' ? 'active' : 'inactive'}`}>{property.situacao || '—'}</span></td>
                  <td>{property.publicado ? 'Publicado' : 'Não publicado'}</td>
                  <td><button className="ghost" onClick={() => showProperty(property)}>Ver detalhes</button></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </section>

      <section className="card management-section">
        <div className="section-head"><div><h2>Prédios</h2><p className="muted">Prédios cadastrados para unidades do tipo apartamento.</p></div></div>
        {!loading && buildings?.length === 0 && <p className="empty">Nenhum prédio cadastrado.</p>}
        {buildings?.length > 0 && (
          <div className="building-grid">
            {buildings.map((building) => (
              <article className="building-card" key={building.id}>
                <h3>{building.nome}</h3>
                <p className="muted">{building.endereco?.cidade} · {building.endereco?.uf}</p>
                <p>{building.numeroAndares} andares · {building.unidadesPorAndar} unidades por andar</p>
                <button className="ghost" onClick={() => showBuilding(building)}>Ver detalhes</button>
              </article>
            ))}
          </div>
        )}
      </section>

      {creatingProperty && <NewPropertyForm
        cities={cities} features={features} buildings={buildings || []} developments={developments}
        initialNature={searchParams.get('natureza') === 'LOTE' ? 'LOTE' : 'CASA'}
        initialQuadraId={searchParams.get('quadraId') || ''}
        onClose={() => { setCreatingProperty(false); navigate('/imoveis', { replace: true }); }}
        onDone={propertySaved}
      />}
      {creatingBuilding && <NewBuildingForm cities={cities} onClose={() => setCreatingBuilding(false)} onDone={buildingSaved} />}
      {selectedProperty && <PropertyDetails property={selectedProperty} onClose={() => setSelectedProperty(null)} onRefresh={() => showProperty(selectedProperty)} />}
      {selectedBuilding && <BuildingDetails building={selectedBuilding} onClose={() => setSelectedBuilding(null)} />}
      {toast}
    </>
  );
}

function NewPropertyForm({ cities, features, buildings, developments, initialNature, initialQuadraId, onClose, onDone }) {
  const [nature, setNature] = useState(initialNature);
  const [form, setForm] = useState({ ...emptyForm, quadraId: initialQuadraId });
  const [featureIds, setFeatureIds] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [coverOrder, setCoverOrder] = useState('1');
  const [photoError, setPhotoError] = useState('');
  const [ownerQuery, setOwnerQuery] = useState('');
  const [owners, setOwners] = useState([]);
  const [ownerLoading, setOwnerLoading] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const update = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));
  const quadraOptions = developments.flatMap((development) => (development.quadras || []).map((quadra) => ({
    ...quadra, development, label: `${development.nome} · ${quadra.identificacao}`,
  })));
  const selectedQuadra = quadraOptions.find((item) => String(item.id) === String(form.quadraId));
  const addressCities = nature === 'LOTE' && selectedQuadra
    ? cities.filter((city) => Number(city.id) === Number(selectedQuadra.development.cidadeId))
    : cities;

  useEffect(() => {
    if (nature === 'LOTE' && selectedQuadra) {
      setForm((current) => ({ ...current, cidadeId: String(selectedQuadra.development.cidadeId) }));
    }
  }, [nature, selectedQuadra?.id, selectedQuadra?.development?.cidadeId]);

  async function searchOwners(event) {
    event.preventDefault();
    if (!ownerQuery.trim()) return setError('Informe parte do nome do proprietário.');
    setOwnerLoading(true);
    setError('');
    try {
      const result = await api.get(`/proprietario?nome=${encodeURIComponent(ownerQuery.trim())}`);
      if (!Array.isArray(result)) throw new Error('A API retornou um formato inesperado para os proprietários.');
      setOwners(result);
    } catch (e) {
      setError(e.message);
      setOwners([]);
    } finally {
      setOwnerLoading(false);
    }
  }

  function choosePhotos(event) {
    const selected = Array.from(event.target.files || []);
    const invalid = selected.find(fileIssue);
    if (invalid) {
      setPhotos([]);
      setPhotoError(fileIssue(invalid));
      return;
    }
    setPhotos(selected);
    setCoverOrder('1');
    setPhotoError('');
  }

  async function submit(event) {
    event.preventDefault();
    if (!form.proprietarioId) return setError('Pesquise e selecione um proprietário da empresa.');
    if (photoError) return;
    if (photos.length === 0) return setPhotoError('Envie ao menos uma foto do imóvel.');
    if (nature === 'APARTAMENTO' && buildings.length === 0) return setError('Cadastre um prédio antes de cadastrar um apartamento.');
    if (nature === 'LOTE' && !form.quadraId) return setError('Selecione uma quadra cadastrada nesta empresa.');
    setBusy(true);
    setError('');
    setPhotoError('');
    try {
      const dto = buildPropertyDto(form, nature, featureIds, Number(coverOrder));
      await api.form('POST', '/imovel', multipart(dto, { fotos: photos }));
      await onDone();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  const priceRequired = form.finalidade === 'VENDA' || form.finalidade === 'VENDA_E_ALUGUEL' || nature === 'LOTE';
  const rentRequired = form.finalidade === 'ALUGUEL' || form.finalidade === 'VENDA_E_ALUGUEL';

  return (
    <Modal title="Cadastrar imóvel" onClose={onClose}>
      <form className="form two property-form" onSubmit={submit}>
        <div className="span2 inline-notice">A API vincula automaticamente o corretor e a empresa da sessão. A cidade selecionada ainda será validada pelo escopo da empresa.</div>
        <Field label="Natureza"><select value={nature} onChange={(event) => setNature(event.target.value)}><option value="CASA">Casa</option><option value="TERRENO">Terreno</option><option value="APARTAMENTO">Apartamento</option><option value="LOTE">Lote</option></select></Field>
        <Field label="Código"><input value={form.codigo} onChange={update('codigo')} required maxLength={50} /></Field>
        <div className="span2"><Field label="Título"><input value={form.titulo} onChange={update('titulo')} required maxLength={180} /></Field></div>
        <div className="span2">
          <div className="owner-search">
            <Field label="Buscar proprietário por nome"><input value={ownerQuery} onChange={(event) => { setOwnerQuery(event.target.value); setForm((current) => ({ ...current, proprietarioId: '' })); setOwners([]); }} maxLength={150} /></Field>
            <button type="button" className="ghost" onClick={searchOwners} disabled={ownerLoading}>{ownerLoading ? 'Buscando…' : 'Buscar'}</button>
          </div>
          <Field label="Proprietário">
            <select value={form.proprietarioId} onChange={update('proprietarioId')} required>
              <option value="">Selecione um resultado da busca</option>
              {owners.map((owner) => <option key={owner.id} value={owner.id}>{owner.nome} · {owner.tipoDocumento} {owner.documento}</option>)}
            </select>
          </Field>
          {owners.length === 0 && <small>Use a busca para selecionar um proprietário autorizado para sua empresa.</small>}
        </div>
        <Field label="Finalidade"><select value={form.finalidade} onChange={update('finalidade')}><option value="VENDA">Venda</option><option value="ALUGUEL">Aluguel</option><option value="VENDA_E_ALUGUEL">Venda e aluguel</option></select></Field>
        {priceRequired && <Field label="Valor de venda (R$)"><input type="number" min="0" step="0.01" value={form.valorVenda} onChange={update('valorVenda')} required /></Field>}
        {rentRequired && <Field label="Valor de aluguel (R$)"><input type="number" min="0" step="0.01" value={form.valorAluguel} onChange={update('valorAluguel')} required /></Field>}
        <Field label="Condomínio (R$, opcional)"><input type="number" min="0" step="0.01" value={form.valorCondominio} onChange={update('valorCondominio')} /></Field>
        <Field label="IPTU (R$, opcional)"><input type="number" min="0" step="0.01" value={form.valorIptu} onChange={update('valorIptu')} /></Field>

        {nature === 'CASA' && <HouseFields form={form} update={update} />}
        {nature === 'TERRENO' && <TerrainFields form={form} update={update} />}
        {nature === 'APARTAMENTO' && <ApartmentFields form={form} update={update} buildings={buildings} />}
        {nature === 'LOTE' && <LotFields form={form} update={update} quadras={quadraOptions} />}

        {nature !== 'APARTAMENTO' && <AddressFields form={form} update={update} cities={addressCities} />}
        <div className="span2">
          <Field label="Características"><select multiple size={4} value={featureIds} onChange={(event) => setFeatureIds(Array.from(event.target.selectedOptions, (option) => option.value))}>{features.map((feature) => <option key={feature.id} value={feature.id}>{feature.nome}</option>)}</select></Field>
        </div>
        <div className="span2"><Field label="Descrição (opcional)"><textarea rows={3} value={form.descricao} onChange={update('descricao')} /></Field></div>
        <div className="span2"><Field label="Fotos (JPEG, PNG ou WebP; até 5 MB cada)" hint="Envie ao menos uma foto. A API limita o arquivo individual a 5 MB."><input type="file" accept="image/jpeg,image/png,image/webp" multiple required onChange={choosePhotos} /></Field></div>
        {photos.length > 0 && <Field label="Foto de capa"><select value={coverOrder} onChange={(event) => setCoverOrder(event.target.value)}>{photos.map((photo, index) => <option key={`${photo.name}-${index}`} value={index + 1}>{index + 1} · {photo.name}</option>)}</select></Field>}
        {photoError && <p className="error span2" role="alert">{photoError}</p>}
        {error && <p className="error span2" role="alert">{error}</p>}
        <div className="row-end span2"><button type="button" className="ghost" onClick={onClose}>Cancelar</button><button className="primary" disabled={busy}>{busy ? 'Cadastrando…' : 'Cadastrar imóvel'}</button></div>
      </form>
    </Modal>
  );
}

function HouseFields({ form, update }) {
  return <>
    <div className="span2"><h3>Dados da casa</h3></div>
    <NumberField label="Área do terreno (m²)" value={form.areaTerreno} onChange={update('areaTerreno')} required positive />
    <NumberField label="Área construída (m²)" value={form.areaConstruida} onChange={update('areaConstruida')} required positive />
    <NumberField label="Quartos" value={form.quartos} onChange={update('quartos')} integer required />
    <NumberField label="Suítes" value={form.suites} onChange={update('suites')} integer required />
    <NumberField label="Banheiros" value={form.banheiros} onChange={update('banheiros')} integer required />
    <NumberField label="Salas" value={form.salas} onChange={update('salas')} integer required />
    <NumberField label="Vagas" value={form.vagas} onChange={update('vagas')} integer required />
    <NumberField label="Pavimentos" value={form.pavimentos} onChange={update('pavimentos')} integer required />
    <NumberField label="Ano de construção" value={form.anoConstrucao} onChange={update('anoConstrucao')} integer required />
    <BooleanField label="Piscina" value={form.piscina} onChange={update('piscina')} />
    <BooleanField label="Quintal" value={form.quintal} onChange={update('quintal')} />
    <BooleanField label="Churrasqueira" value={form.churrasqueira} onChange={update('churrasqueira')} />
    <BooleanField label="Mobiliada" value={form.mobiliada} onChange={update('mobiliada')} />
  </>;
}

function TerrainFields({ form, update }) {
  return <>
    <div className="span2"><h3>Dados do terreno</h3></div>
    <NumberField label="Área total (m²)" value={form.areaTotal} onChange={update('areaTotal')} required positive />
    <NumberField label="Frente (m)" value={form.frente} onChange={update('frente')} required positive />
    <NumberField label="Fundo (m)" value={form.fundo} onChange={update('fundo')} required positive />
    <NumberField label="Lateral esquerda (m)" value={form.lateralEsquerda} onChange={update('lateralEsquerda')} required positive />
    <NumberField label="Lateral direita (m)" value={form.lateralDireita} onChange={update('lateralDireita')} required positive />
    <Field label="Topografia"><select value={form.topografia} onChange={update('topografia')}><option value="PLANO">Plano</option><option value="ACLIVE">Aclive</option><option value="DECLIVE">Declive</option></select></Field>
    <BooleanField label="Murado" value={form.muro} onChange={update('muro')} />
    <BooleanField label="Esquina" value={form.esquina} onChange={update('esquina')} />
    <div className="span2"><Field label="Uso permitido"><input value={form.usoPermitido} onChange={update('usoPermitido')} required /></Field></div>
  </>;
}

function ApartmentFields({ form, update, buildings }) {
  return <>
    <div className="span2"><h3>Dados do apartamento</h3><p className="muted">O endereço e a cidade vêm do prédio selecionado.</p></div>
    <div className="span2"><Field label="Prédio"><select value={form.predioId} onChange={update('predioId')} required><option value="">Selecione</option>{buildings.map((building) => <option key={building.id} value={building.id}>{building.nome} · {building.endereco?.cidade}</option>)}</select></Field></div>
    <NumberField label="Andar" value={form.andar} onChange={update('andar')} integer required />
    <Field label="Número da unidade"><input value={form.numeroUnidade} onChange={update('numeroUnidade')} required maxLength={30} /></Field>
    <NumberField label="Área privativa (m²)" value={form.areaPrivativa} onChange={update('areaPrivativa')} required positive />
    <NumberField label="Área total (m²)" value={form.areaTotal} onChange={update('areaTotal')} required positive />
    <NumberField label="Quartos" value={form.quartos} onChange={update('quartos')} integer required />
    <NumberField label="Suítes" value={form.suites} onChange={update('suites')} integer required />
    <NumberField label="Banheiros" value={form.banheiros} onChange={update('banheiros')} integer required />
    <NumberField label="Vagas" value={form.vagas} onChange={update('vagas')} integer required />
    <BooleanField label="Varanda" value={form.varanda} onChange={update('varanda')} />
    <Field label="Posição solar"><input value={form.posicaoSolar} onChange={update('posicaoSolar')} required maxLength={40} /></Field>
  </>;
}

function LotFields({ form, update, quadras }) {
  return <>
    <div className="span2"><h3>Dados do lote</h3><p className="muted">A cidade é vinculada ao loteamento da quadra selecionada.</p></div>
    <div className="span2"><Field label="Quadra"><select value={form.quadraId} onChange={(event) => { update('quadraId')(event); }} required><option value="">Selecione</option>{quadras.map((quadra) => <option key={quadra.id} value={quadra.id}>{quadra.label}</option>)}</select></Field></div>
    <Field label="Número do lote"><input value={form.numeroLote} onChange={update('numeroLote')} required maxLength={30} /></Field>
    <NumberField label="Área (m²)" value={form.areaLote} onChange={update('areaLote')} required positive />
    <NumberField label="Frente (m)" value={form.frenteLote} onChange={update('frenteLote')} required positive />
    <NumberField label="Fundo (m)" value={form.fundoLote} onChange={update('fundoLote')} required positive />
    <div className="span2"><Field label="Condições de parcelamento"><textarea rows={2} value={form.condicoesParcelamento} onChange={update('condicoesParcelamento')} required maxLength={4000} /></Field></div>
  </>;
}

function AddressFields({ form, update, cities }) {
  return <>
    <div className="span2"><h3>Endereço</h3></div>
    <Field label={cities.length === 1 ? 'Cidade disponível' : 'Cidade'}><select value={form.cidadeId} onChange={update('cidadeId')} required><option value="">Selecione</option>{cities.map((city) => <option key={city.id} value={city.id}>{city.nome} · {city.uf}</option>)}</select></Field>
    <Field label="CEP"><input inputMode="numeric" value={form.cep} onChange={update('cep')} required minLength={8} maxLength={8} pattern="\d{8}" /></Field>
    <div className="span2"><Field label="Logradouro"><input value={form.logradouro} onChange={update('logradouro')} required maxLength={180} /></Field></div>
    <Field label="Número"><input value={form.numero} onChange={update('numero')} required maxLength={20} /></Field>
    <Field label="Complemento (opcional)"><input value={form.complemento} onChange={update('complemento')} maxLength={100} /></Field>
    <Field label="Bairro"><input value={form.bairro} onChange={update('bairro')} required maxLength={100} /></Field>
    <Field label="Latitude"><input type="number" min="-90" max="90" step="any" value={form.latitude} onChange={update('latitude')} required /></Field>
    <Field label="Longitude"><input type="number" min="-180" max="180" step="any" value={form.longitude} onChange={update('longitude')} required /></Field>
  </>;
}

function NumberField({ label, value, onChange, required = false, positive = false, integer = false }) {
  return <Field label={label}><input type="number" min={positive ? '0.01' : '0'} step={integer ? '1' : '0.01'} value={value} onChange={onChange} required={required} /></Field>;
}

function BooleanField({ label, value, onChange }) {
  return <Field label={label}><select value={String(value)} onChange={(event) => onChange({ target: { value: event.target.value === 'true' } })}><option value="false">Não</option><option value="true">Sim</option></select></Field>;
}

function AddressSummary({ address }) {
  if (!address) return null;
  return <p>{[address.logradouro, address.numero, address.complemento, address.bairro, `${address.cidade || ''} ${address.uf || ''}`.trim()].filter(Boolean).join(', ')}</p>;
}

function BuildingDetails({ building, onClose }) {
  return <Modal title={building.nome} onClose={onClose}>
    <div className="detail-stack">
      <AddressSummary address={building.endereco} />
      <dl className="detail-grid">
        <div><dt>Andares</dt><dd>{building.numeroAndares}</dd></div><div><dt>Unidades por andar</dt><dd>{building.unidadesPorAndar}</dd></div>
        <div><dt>Ano de construção</dt><dd>{building.anoConstrucao}</dd></div><div><dt>Elevadores</dt><dd>{building.elevadores}</dd></div>
        <div><dt>Condomínio base</dt><dd>{money(building.valorCondominioBase)}</dd></div>
        <div><dt>Estrutura</dt><dd>{[['Portaria 24h', building.portaria24h], ['Piscina', building.piscina], ['Academia', building.academia], ['Salão de festas', building.salaoFestas], ['Playground', building.playground]].filter(([, enabled]) => enabled).map(([label]) => label).join(', ') || '—'}</dd></div>
      </dl>
    </div>
  </Modal>;
}

function PropertyDetails({ property, onClose, onRefresh }) {
  const address = property.endereco || property.apartamento?.predio?.endereco;
  const specifics = property.casa || property.terreno || property.apartamento || property.lote;
  const featureList = (property.caracteristicas || []).map((item) => item.nome).join(', ') || '—';
  return <Modal title={`${property.codigo} · ${property.titulo}`} onClose={onClose}>
    <div className="detail-stack">
      <div className="property-detail-top"><span className={`status-pill ${property.situacao === 'DISPONIVEL' ? 'active' : 'inactive'}`}>{property.situacao || '—'}</span><span className="pill">{property.publicado ? 'Publicado' : 'Não publicado'}</span></div>
      {address && <AddressSummary address={address} />}
      <dl className="detail-grid">
        <div><dt>Proprietário</dt><dd>{property.nomeProprietario || '—'}</dd></div>
        <div><dt>Corretor</dt><dd>{property.nomeCorretor || '—'}</dd></div>
        <div><dt>Natureza</dt><dd>{natureLabel[property.natureza] || property.natureza}</dd></div>
        <div><dt>Finalidade</dt><dd>{property.finalidade}</dd></div>
        <div><dt>Venda</dt><dd>{money(property.valorVenda)}</dd></div>
        <div><dt>Aluguel</dt><dd>{money(property.valorAluguel)}</dd></div>
        <div><dt>Condomínio</dt><dd>{money(property.valorCondominio)}</dd></div>
        <div><dt>IPTU</dt><dd>{money(property.valorIptu)}</dd></div>
      </dl>
      {specifics && <section><h3>Dados de {natureLabel[property.natureza]?.toLowerCase()}</h3><dl className="detail-grid">{Object.entries(specifics).filter(([, value]) => value == null || typeof value !== 'object').map(([key, value]) => <div key={key}><dt>{humanize(key)}</dt><dd>{typeof value === 'boolean' ? (value ? 'Sim' : 'Não') : value ?? '—'}</dd></div>)}</dl></section>}
      <section><h3>Características</h3><p>{featureList}</p></section>
      {property.descricao && <section><h3>Descrição</h3><p>{property.descricao}</p></section>}
      <section><h3>Fotos</h3><PropertyImages property={property} onRefresh={onRefresh} /></section>
      <p className="muted">Publicação e situação são apresentadas como retornadas pela API. As ações de gestão pertencem ao perfil gestor, mas a API não oferece a esse perfil uma lista autorizada de imóveis.</p>
    </div>
  </Modal>;
}

function PropertyImages({ property, onRefresh }) {
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');
  const [busy, setBusy] = useState(false);

  async function send(method, imageId = null, selectedFile = file) {
    if (method === 'PUT' && !imageId) return setError('Não é possível substituir esta foto porque a API não retornou o identificador da imagem.');
    const issue = fileIssue(selectedFile);
    if (issue) return setError(issue);
    setBusy(true);
    setError('');
    try {
      const form = new FormData();
      form.append('arquivo', selectedFile);
      const path = imageId
        ? `/imagens/IMOVEL/${property.id}/${encodeURIComponent(imageId)}`
        : `/imagens/IMOVEL/${property.id}`;
      await api.form(method, path, form);
      setFile(null);
      await onRefresh();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function remove(photo) {
    if (!photo.imagemId) return setError('Não é possível remover esta foto porque a API não retornou o identificador da imagem.');
    if (property.fotos.length <= 1) return setError('A API exige que cada imóvel mantenha ao menos uma foto.');
    if (!confirm('Remover esta foto do imóvel?')) return;
    setBusyId(photo.imagemId);
    setError('');
    try {
      await api.delete(`/imagens/IMOVEL/${property.id}/${encodeURIComponent(photo.imagemId)}`);
      await onRefresh();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusyId('');
    }
  }

  return <>
    {property.fotos?.length > 0 && <div className="photo-grid">{property.fotos.map((photo) => (
      <article className="photo-card" key={photo.imagemId || photo.id}>
        <img src={assetUrl(photo.url)} alt={`Foto ${photo.ordem} de ${property.titulo}`} />
        <div><strong>{photo.capa ? 'Capa' : `Foto ${photo.ordem}`}</strong>
          <div className="row-end">
            {photo.imagemId && <label className="ghost file-action">Substituir<input aria-label={`Substituir foto ${photo.ordem}`} type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={(event) => { const selected = event.target.files?.[0]; setFile(selected || null); const issue = fileIssue(selected); setError(issue); if (selected && !issue) send('PUT', photo.imagemId, selected); }} /></label>}
            <button className="ghost danger" disabled={!photo.imagemId || busyId === photo.imagemId || property.fotos.length <= 1} onClick={() => remove(photo)}>{busyId === photo.imagemId ? 'Removendo…' : 'Remover'}</button>
          </div>
          {!photo.imagemId && <small className="muted">A API não retornou o identificador desta imagem; não é possível alterá-la.</small>}
        </div>
      </article>
    ))}</div>}
    {property.fotos?.length === 1 && <p className="muted">A API exige ao menos uma foto por imóvel; a última imagem não pode ser removida.</p>}
    <div className="photo-add"><Field label="Adicionar foto (JPEG, PNG ou WebP; até 5 MB)"><input type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={(event) => { setFile(event.target.files?.[0] || null); setError(fileIssue(event.target.files?.[0])); }} /></Field><button className="primary" disabled={!file || busy} onClick={() => send('POST')}>{busy ? 'Enviando…' : 'Adicionar foto'}</button></div>
    {error && <p className="error" role="alert">{error}</p>}
  </>;
}

function humanize(value) {
  return value.replace(/([A-Z])/g, ' $1').replace(/^./, (letter) => letter.toUpperCase());
}

function NewBuildingForm({ cities, onClose, onDone }) {
  const [form, setForm] = useState({ nome: '', cidadeId: '', cep: '', logradouro: '', numero: '', complemento: '', bairro: '', latitude: '', longitude: '', numeroAndares: '', unidadesPorAndar: '', anoConstrucao: '0', elevadores: '0', portaria24h: false, piscina: false, academia: false, salaoFestas: false, playground: false, valorCondominioBase: '0' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const update = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api.post('/predio', {
        nome: form.nome.trim(),
        endereco: {
          cep: form.cep.trim(), logradouro: form.logradouro.trim(), numero: form.numero.trim(),
          complemento: form.complemento.trim() || null, bairro: form.bairro.trim(), cidadeId: Number(form.cidadeId),
          latitude: Number(form.latitude), longitude: Number(form.longitude),
        },
        numeroAndares: Number(form.numeroAndares), unidadesPorAndar: Number(form.unidadesPorAndar),
        anoConstrucao: Number(form.anoConstrucao), elevadores: Number(form.elevadores),
        portaria24h: form.portaria24h, piscina: form.piscina, academia: form.academia,
        salaoFestas: form.salaoFestas, playground: form.playground,
        valorCondominioBase: Number(form.valorCondominioBase),
      });
      await onDone();
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  }

  return <Modal title="Cadastrar prédio" onClose={onClose}>
    <form className="form two" onSubmit={submit}>
      <div className="span2 inline-notice">A cidade será validada pela API conforme a área de atuação da empresa.</div>
      <div className="span2"><Field label="Nome"><input value={form.nome} onChange={update('nome')} required maxLength={180} /></Field></div>
      <Field label="Cidade"><select value={form.cidadeId} onChange={update('cidadeId')} required><option value="">Selecione</option>{cities.map((city) => <option key={city.id} value={city.id}>{city.nome} · {city.uf}</option>)}</select></Field>
      <Field label="CEP"><input inputMode="numeric" value={form.cep} onChange={update('cep')} required minLength={8} maxLength={8} pattern="\d{8}" /></Field>
      <div className="span2"><Field label="Logradouro"><input value={form.logradouro} onChange={update('logradouro')} required maxLength={180} /></Field></div>
      <Field label="Número"><input value={form.numero} onChange={update('numero')} required maxLength={20} /></Field>
      <Field label="Complemento (opcional)"><input value={form.complemento} onChange={update('complemento')} maxLength={100} /></Field>
      <Field label="Bairro"><input value={form.bairro} onChange={update('bairro')} required maxLength={100} /></Field>
      <Field label="Latitude"><input type="number" min="-90" max="90" step="any" value={form.latitude} onChange={update('latitude')} required /></Field>
      <Field label="Longitude"><input type="number" min="-180" max="180" step="any" value={form.longitude} onChange={update('longitude')} required /></Field>
      <NumberField label="Andares" value={form.numeroAndares} onChange={update('numeroAndares')} integer required positive />
      <NumberField label="Unidades por andar" value={form.unidadesPorAndar} onChange={update('unidadesPorAndar')} integer required positive />
      <NumberField label="Ano de construção" value={form.anoConstrucao} onChange={update('anoConstrucao')} integer required />
      <NumberField label="Elevadores" value={form.elevadores} onChange={update('elevadores')} integer required />
      <NumberField label="Condomínio base (R$)" value={form.valorCondominioBase} onChange={update('valorCondominioBase')} required />
      {['portaria24h', 'piscina', 'academia', 'salaoFestas', 'playground'].map((key) => <BooleanField key={key} label={humanize(key)} value={form[key]} onChange={update(key)} />)}
      {error && <p className="error span2" role="alert">{error}</p>}
      <div className="row-end span2"><button type="button" className="ghost" onClick={onClose}>Cancelar</button><button className="primary" disabled={busy}>{busy ? 'Cadastrando…' : 'Cadastrar prédio'}</button></div>
    </form>
  </Modal>;
}
