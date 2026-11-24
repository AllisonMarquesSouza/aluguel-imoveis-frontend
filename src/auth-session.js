const PERFIS = new Set(['ADMINISTRADOR', 'GESTOR', 'CORRETOR', 'CLIENTE']);
const PERFIS_DO_PAINEL = new Set(['ADMINISTRADOR', 'GESTOR', 'CORRETOR']);

function decodePayload(token) {
  if (typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3 || !parts[1]) return null;

  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return null;
  }
}

function readProfile(payload) {
  const raw = payload.perfil ?? payload.role ?? payload.roles?.[0] ?? payload.authorities?.[0];
  return normalizeProfile(raw);
}

function normalizeProfile(raw) {
  const value = typeof raw === 'string' ? raw : raw?.authority;
  if (typeof value !== 'string') return null;

  const perfil = value.replace(/^ROLE_/, '').toUpperCase();
  return PERFIS.has(perfil) ? perfil : null;
}

// O conteúdo do JWT serve apenas para navegação. A API continua validando a assinatura e as permissões.
export function readSession(token, now = Date.now(), profileFallback = null) {
  const payload = decodePayload(token);
  const exp = Number(payload?.exp);
  if (!payload || !Number.isFinite(exp) || exp * 1000 <= now) return null;

  return {
    nome: payload.nome ?? payload.name ?? null,
    email: payload.email ?? payload.sub ?? null,
    perfil: readProfile(payload) ?? normalizeProfile(profileFallback),
    exp,
  };
}

// Fail closed: perfil ausente ou não reconhecido nunca libera uma ação condicionada.
export function can(session, ...perfis) {
  return Boolean(session?.perfil && perfis.includes(session.perfil));
}

export function canAccessPanel(session) {
  return Boolean(session?.perfil && PERFIS_DO_PAINEL.has(session.perfil));
}
