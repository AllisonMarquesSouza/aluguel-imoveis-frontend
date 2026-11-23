import { useCallback, useEffect, useState } from 'react';
import { api } from '../api.js';
import { Field, useToast } from '../ui.jsx';

export default function CadastrosAuxiliares() {
  const [cities, setCities] = useState(null);
  const [features, setFeatures] = useState(null);
  const [cityForm, setCityForm] = useState({ nome: '', uf: '' });
  const [featureName, setFeatureName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [toast, show] = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    const [cityResult, featureResult] = await Promise.allSettled([
      api.get('/cidade'),
      api.get('/caracteristica'),
    ]);
    const failures = [];
    if (cityResult.status === 'fulfilled') setCities(cityResult.value);
    else failures.push(`Cidades: ${cityResult.reason.message}`);
    if (featureResult.status === 'fulfilled') setFeatures(featureResult.value);
    else failures.push(`Características: ${featureResult.reason.message}`);
    setError(failures.join(' '));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function addCity(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api.post('/cidade', { nome: cityForm.nome.trim(), uf: cityForm.uf.trim().toUpperCase() });
      setCityForm({ nome: '', uf: '' });
      show('Cidade cadastrada.');
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function removeCity(city) {
    if (!confirm(`Remover ${city.nome} (${city.uf})?`)) return;
    setError('');
    try {
      await api.delete(`/cidade/${city.id}`);
      show('Cidade removida.');
      await load();
    } catch (e) {
      setError(e.message);
    }
  }

  async function addFeature(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api.post('/caracteristica', { nome: featureName.trim() });
      setFeatureName('');
      show('Característica cadastrada.');
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <header className="page-head">
        <div>
          <h1>Cadastros auxiliares</h1>
          <p className="muted">Cidades e características mantidas pela API.</p>
        </div>
        <button className="ghost" onClick={load} disabled={loading}>Atualizar</button>
      </header>

      {error && <p className="error page-message" role="alert">{error}</p>}
      {loading && <p className="muted page-message" role="status">Carregando cadastros…</p>}

      <div className="admin-columns">
        <section className="card admin-section">
          <h2>Cidades</h2>
          <form className="form inline-form" onSubmit={addCity}>
            <Field label="Nome"><input value={cityForm.nome} onChange={(event) => setCityForm({ ...cityForm, nome: event.target.value })} maxLength={120} required /></Field>
            <Field label="UF"><input value={cityForm.uf} onChange={(event) => setCityForm({ ...cityForm, uf: event.target.value })} maxLength={2} minLength={2} required /></Field>
            <button className="primary" disabled={busy}>Adicionar cidade</button>
          </form>
          {cities?.length === 0 && <p className="empty">Nenhuma cidade cadastrada.</p>}
          {cities?.length > 0 && (
            <div className="table-wrap">
              <table className="data-table">
                <thead><tr><th>Cidade</th><th>UF</th><th>Ação</th></tr></thead>
                <tbody>
                  {cities.map((city) => (
                    <tr key={city.id}>
                      <td>{city.nome}</td><td>{city.uf}</td>
                      <td><button className="ghost danger" onClick={() => removeCity(city)}>Remover</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="card admin-section">
          <h2>Características</h2>
          <form className="form inline-form feature-form" onSubmit={addFeature}>
            <Field label="Nome"><input value={featureName} onChange={(event) => setFeatureName(event.target.value)} maxLength={50} required /></Field>
            <button className="primary" disabled={busy}>Adicionar característica</button>
          </form>
          {features?.length === 0 && <p className="empty">Nenhuma característica cadastrada.</p>}
          {features?.length > 0 && (
            <ul className="catalog-list">
              {features.map((feature) => <li key={feature.id}>{feature.nome}</li>)}
            </ul>
          )}
        </section>
      </div>
      {toast}
    </>
  );
}
