const BASE = import.meta.env?.VITE_API_BASE_URL ?? import.meta.env?.VITE_API_URL ?? '/api';
const KEY = 'mi_token';
// Perfil persistido apenas para restaurar a navegação; a API autoriza cada operação.
const PROFILE_KEY = 'mi_perfil';

let token = localStorage.getItem(KEY);
let storedProfile = localStorage.getItem(PROFILE_KEY);
let unauthorizedHandler = null;
export const getToken = () => token;
export const getStoredProfile = () => storedProfile;
export function setToken(t, perfil = null) {
  token = t;
  if (t) {
    localStorage.setItem(KEY, t);
    storedProfile = typeof perfil === 'string' ? perfil : null;
    if (storedProfile) localStorage.setItem(PROFILE_KEY, storedProfile);
    else localStorage.removeItem(PROFILE_KEY);
  } else {
    localStorage.removeItem(KEY);
    localStorage.removeItem(PROFILE_KEY);
    storedProfile = null;
  }
}

export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = handler;
  return () => {
    if (unauthorizedHandler === handler) unauthorizedHandler = null;
  };
}

// As imagens vêm como URL relativa (/imagens/...): junte com a origem da API.
export const assetUrl = (p) => (!p ? null : /^https?:/.test(p) ? p : BASE + p);

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

const FALLBACK = {
  400: 'Dados inválidos. Revise os campos.',
  401: 'Não autorizado.',
  403: 'Você não tem permissão para esta ação.',
  404: 'Não encontrado.',
  409: 'Conflito: o registro já existe ou o estado atual não permite a ação.',
  413: 'Arquivo grande demais (a API limita cada arquivo a 5 MB).',
  415: 'Tipo de conteúdo não suportado.',
};

async function request(method, path, { json, form, auth = true, responseType = 'json' } = {}) {
  const headers = {};
  const requestToken = auth ? token : null;
  if (requestToken) headers.Authorization = `Bearer ${requestToken}`;
  let body;
  if (form) body = form; // o browser define o boundary do multipart
  else if (json !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(json);
  }

  let res;
  try {
    res = await fetch(BASE + path, { method, headers, body });
  } catch {
    throw new ApiError('Não foi possível conectar à API. Verifique se ela está no ar.', 0);
  }

  if (!res.ok) {
    if (res.status === 401 && requestToken && token === requestToken) unauthorizedHandler?.();
    let message;
    try {
      message = (await res.json()).message;
    } catch {}
    throw new ApiError(message || FALLBACK[res.status] || `Erro ${res.status}`, res.status);
  }
  if (res.status === 204) return null;
  if (responseType === 'blob') {
    const disposition = res.headers.get('content-disposition') || '';
    const encodedName = disposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
    const plainName = disposition.match(/filename="?([^";]+)"?/i)?.[1];
    let filename = plainName || 'arquivo';
    if (encodedName) {
      try { filename = decodeURIComponent(encodedName); } catch { filename = encodedName; }
    }
    return { blob: await res.blob(), filename };
  }
  return (res.headers.get('content-type') || '').includes('json') ? res.json() : null;
}

export const api = {
  get: (path) => request('GET', path),
  post: (path, json, opts) => request('POST', path, { json, ...opts }),
  put: (path, json) => request('PUT', path, { json }),
  patch: (path, json) => request('PATCH', path, json === undefined ? {} : { json }),
  delete: (path) => request('DELETE', path),
  form: (method, path, form) => request(method, path, { form }),
  download: (path) => request('GET', path, { responseType: 'blob' }),
};

// Monta o multipart que a API espera: parte "dto" (JSON) + arquivos.
export function multipart(dto, files = {}) {
  const f = new FormData();
  f.append('dto', new Blob([JSON.stringify(dto)], { type: 'application/json' }));
  Object.entries(files).forEach(([name, value]) => {
    (Array.isArray(value) ? value : [value]).forEach((file) => f.append(name, file));
  });
  return f;
}
