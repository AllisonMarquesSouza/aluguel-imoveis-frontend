import { useState } from 'react';
import { useAuth } from '../auth.jsx';
import { Field } from '../ui.jsx';

const towers = [[0, 150], [46, 230], [92, 180], [150, 290], [212, 200], [262, 260], [318, 170], [372, 240]];

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      await login(email.trim(), senha);
    } catch (e) {
      setErr(e.status === 401 ? 'E-mail ou senha incorretos, ou conta inativa.' : e.message);
      setBusy(false);
    }
  }

  return (
    <div className="login">
      <section className="login-art">
        <div className="brand"><i />Meu Imóvel</div>
        <h1>Cada imóvel merece o corretor certo.</h1>
        <p>Gerencie a equipe que apresenta seus imóveis ao público.</p>
        <svg viewBox="0 0 440 320" className="skyline" aria-hidden="true">
          <defs>
            <pattern id="win" width="12" height="16" patternUnits="userSpaceOnUse">
              <rect x="3" y="4" width="5" height="7" rx="1" fill="#2cb5a0" opacity=".55" />
            </pattern>
          </defs>
          {towers.map(([x, h], i) => (
            <g key={i}>
              <rect x={x} y={320 - h} width="40" height={h} rx="3" fill="#133f4f" />
              <rect x={x} y={320 - h} width="40" height={h} rx="3" fill="url(#win)" />
            </g>
          ))}
        </svg>
      </section>
      <section className="login-form">
        <form onSubmit={submit}>
          <h2>Entrar</h2>
          <p className="muted">Acesso restrito à equipe.</p>
          <Field label="E-mail">
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" required autoFocus />
          </Field>
          <Field label="Senha">
            <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} autoComplete="current-password" required />
          </Field>
          {err && <p className="error" role="alert">{err}</p>}
          <button className="primary block" disabled={busy}>{busy ? 'Entrando…' : 'Entrar'}</button>
        </form>
      </section>
    </div>
  );
}
