import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { can, useAuth } from '../auth.jsx';

const sources = [
  ['Corretores ativos', '/corretor'],
  ['Cidades', '/cidade'],
  ['Imobiliárias', '/empresa'], // só administrador
  ['Imóveis da sua empresa', '/imovel'], // só corretor
];

export default function Dashboard() {
  const { session } = useAuth();
  const [counts, setCounts] = useState(null);

  useEffect(() => {
    Promise.allSettled(sources.map(([, path]) => api.get(path))).then((r) =>
      setCounts(r.map((x) => (x.status === 'fulfilled' && Array.isArray(x.value) ? x.value.length : null)))
    );
  }, []);

  return (
    <>
      <header className="page-head">
        <div>
          <h1>Olá, {session.nome || session.email || 'bem-vindo'}</h1>
          <p className="muted">Resumo do que está publicado na vitrine.</p>
        </div>
      </header>

      <div className="stats">
        {counts === null && <div className="stat skeleton" />}
        {counts?.map((n, i) => n !== null && (
          <div className="stat" key={i}>
            <strong>{n}</strong>
            <span>{sources[i][0]}</span>
          </div>
        ))}
      </div>

      <div className="actions">
        <Link to="/corretores" className="action">
          <h3>Equipe de corretores</h3>
          <p>Veja quem aparece na vitrine, cadastre novos corretores e desative quem saiu.</p>
        </Link>
        {can(session, 'ADMINISTRADOR') && (
          <Link to="/usuarios" className="action">
            <h3>Novo usuário</h3>
            <p>Crie contas de administrador, gestor ou corretor e vincule à imobiliária.</p>
          </Link>
        )}
      </div>
    </>
  );
}
