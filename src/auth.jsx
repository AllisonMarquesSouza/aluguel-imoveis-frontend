import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, getStoredProfile, getToken, setToken, setUnauthorizedHandler } from './api.js';
import { can, readSession } from './auth-session.js';

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);
export { can };

function loadInitialState() {
  const token = getToken();
  if (!token) return { session: null, notice: '' };

  const session = readSession(token, Date.now(), getStoredProfile());
  if (session) return { session, notice: '' };

  setToken(null);
  return { session: null, notice: 'Sua sessão expirou ou não é válida. Entre novamente.' };
}

export function AuthProvider({ children }) {
  const [initial] = useState(loadInitialState);
  const [session, setSession] = useState(initial.session);
  const [notice, setNotice] = useState(initial.notice);

  const logout = useCallback((message = '') => {
    setToken(null);
    setSession(null);
    setNotice(message);
  }, []);

  const handleUnauthorized = useCallback(() => {
    logout('Sua sessão expirou. Entre novamente.');
  }, [logout]);

  useEffect(() => setUnauthorizedHandler(handleUnauthorized), [handleUnauthorized]);

  const login = useCallback(async (email, senha) => {
    setNotice('');
    const { token, perfil } = await api.post('/auth/login', { email, senha }, { auth: false });
    const nextSession = readSession(token, Date.now(), perfil);
    if (!nextSession) throw new Error('A API retornou um token inválido ou expirado.');
    setToken(token, nextSession.perfil);
    setSession(nextSession);
    if (!nextSession.perfil) {
      setNotice('Login aceito, mas a API não informou o perfil desta conta. O painel ficará bloqueado até esse dado estar disponível.');
    }
    return nextSession;
  }, []);

  // O JWT da API expira em duas horas.
  useEffect(() => {
    if (!session?.exp) return;
    const ms = session.exp * 1000 - Date.now();
    const id = setTimeout(() => logout('Sua sessão expirou. Entre novamente.'), Math.max(ms, 0));
    return () => clearTimeout(id);
  }, [session, logout]);

  return <Ctx.Provider value={{ session, login, logout, notice }}>{children}</Ctx.Provider>;
}
