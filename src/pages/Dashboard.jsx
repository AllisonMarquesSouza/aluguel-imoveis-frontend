import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { can, useAuth } from '../auth.jsx';
import { dashboardSourcesFor } from '../dashboard-metrics.js';

export default function Dashboard() {
  const { session } = useAuth();
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const sources = dashboardSourcesFor(session.perfil);

  useEffect(() => {
    let active = true;
    if (!sources.length) {
      setMetrics([]);
      setLoading(false);
      setError('');
      return () => { active = false; };
    }

    setLoading(true);
    setError('');
    Promise.allSettled(sources.map((source) => api.get(source.path))).then((results) => {
      if (!active) return;
      const values = results.map((result, index) => ({
        ...sources[index],
        value: result.status === 'fulfilled' && Array.isArray(result.value) ? result.value.length : null,
        error: result.status === 'rejected'
          ? result.reason.message
          : result.status === 'fulfilled' && !Array.isArray(result.value)
            ? 'A API retornou um formato inesperado.'
            : '',
      }));
      setMetrics(values);
      setError(values.filter((item) => item.error).map((item) => `${item.label}: ${item.error}`).join(' '));
      setLoading(false);
    });

    return () => { active = false; };
  }, [session.perfil, retry]);

  return (
    <>
      <header className="page-head">
        <div>
          <h1>Olá, {session.nome || session.email || 'bem-vindo'}</h1>
          <p className="muted">Resumo disponível para o seu perfil.</p>
        </div>
      </header>

      {loading && (
        <div className="stats" aria-label="Carregando indicadores">
          {sources.map((source) => <div className="stat skeleton" key={source.path} />)}
        </div>
      )}
      {!loading && metrics.length > 0 && (
        <div className="stats">
          {metrics.filter((item) => item.value !== null).map((item) => (
            <div className="stat" key={item.path}>
              <strong>{item.value}</strong>
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      )}
      {!loading && error && (
        <div className="request-state">
          <p className="error" role="alert">{error}</p>
          <button className="ghost" onClick={() => setRetry((value) => value + 1)}>Tentar novamente</button>
        </div>
      )}
      {!loading && !error && sources.length === 0 && can(session, 'GESTOR') && (
        <p className="muted request-state">Os indicadores da equipe ainda não estão disponíveis.</p>
      )}

      <div className="actions">
        {can(session, 'GESTOR') && (
          <Link to="/corretores" className="action">
            <h3>Equipe de corretores</h3>
            <p>Cadastre corretores e acompanhe a disponibilidade da equipe.</p>
          </Link>
        )}
        {can(session, 'CORRETOR') && (
          <Link to="/proprietarios" className="action">
            <h3>Proprietários</h3>
            <p>Pesquise e cadastre proprietários da sua empresa.</p>
          </Link>
        )}
        {can(session, 'ADMINISTRADOR') && (
          <>
            <Link to="/empresas" className="action">
              <h3>Empresas</h3>
              <p>Consulte e administre empresas cadastradas.</p>
            </Link>
            <Link to="/usuarios" className="action">
              <h3>Novo usuário</h3>
              <p>Crie uma conta conforme as permissões da API.</p>
            </Link>
          </>
        )}
      </div>
    </>
  );
}
