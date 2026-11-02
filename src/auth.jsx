import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, getToken, setToken } from './api.js';

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

// Sem perfil no token, mostramos tudo e deixamos a API recusar o que não for permitido.
export const can = (session, ...perfis) => !session?.perfil || perfis.includes(session.perfil);

function decode(token) {
  try {
    const b64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(decodeURIComponent(escape(atob(b64))));
  } catch {
    return null;
  }
}

// AJUSTE AQUI se o seu JWT guarda o perfil em outro claim.
function readSession(token) {
  const p = decode(token);
  if (!p) return { nome: null, email: null, perfil: null, exp: null };
  if (p.exp && p.exp * 1000 < Date.now()) return null;
  const raw = p.perfil ?? p.role ?? p.roles?.[0] ?? p.authorities?.[0];
  const perfil = (typeof raw === 'string' ? raw : raw?.authority)?.replace('ROLE_', '') ?? null;
  return { nome: p.nome ?? p.name ?? null, email: p.email ?? p.sub ?? null, perfil, exp: p.exp ?? null };
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => {
    const t = getToken();
    const s = t ? readSession(t) : null;
    if (!s) setToken(null);
    return s;
  });

  const login = useCallback(async (email, senha) => {
    const { token } = await api.post('/auth/login', { email, senha }, { auth: false });
    setToken(token);
    setSession(readSession(token));
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setSession(null);
  }, []);

  // O token dura 2h: sai sozinho quando expirar.
  useEffect(() => {
    if (!session?.exp) return;
    const ms = session.exp * 1000 - Date.now();
    const id = setTimeout(logout, Math.max(ms, 0));
    return () => clearTimeout(id);
  }, [session, logout]);

  return <Ctx.Provider value={{ session, login, logout }}>{children}</Ctx.Provider>;
}
