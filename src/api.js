const BASE = import.meta.env.VITE_API_URL ?? '/api';
const KEY = 'mi_token';

let token = localStorage.getItem(KEY);
export const getToken = () => token;
export function setToken(t) {
  token = t;
  t ? localStorage.setItem(KEY, t) : localStorage.removeItem(KEY);
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
  413: 'Arquivo grande demais (o limite atual da API é 1 MB por arquivo).',
  415: 'Tipo de conteúdo não suportado.',
};

async function request(method, path, { json, form, auth = true } = {}) {
  const headers = {};
  if (auth && token) headers.Authorization = `Bearer ${token}`;
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
    let message;
    try {
      message = (await res.json()).message;
    } catch {}
    throw new ApiError(message || FALLBACK[res.status] || `Erro ${res.status}`, res.status);
  }
  if (res.status === 204) return null;
  return (res.headers.get('content-type') || '').includes('json') ? res.json() : null;
}

export const api = {
  get: (path) => request('GET', path),
  post: (path, json, opts) => request('POST', path, { json, ...opts }),
  patch: (path) => request('PATCH', path),
  form: (method, path, form) => request(method, path, { form }),
};

// Monta o multipart que a API espera: parte "dto" (JSON) + arquivos.
export function multipart(dto, files = {}) {
  const f = new FormData();
  f.append('dto', new Blob([JSON.stringify(dto)], { type: 'application/json' }));
  Object.entries(files).forEach(([name, file]) => f.append(name, file));
  return f;
}
