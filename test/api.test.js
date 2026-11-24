import assert from 'node:assert/strict';
import test from 'node:test';

const storage = new Map();
globalThis.localStorage = {
  getItem: (key) => storage.get(key) ?? null,
  setItem: (key, value) => storage.set(key, String(value)),
  removeItem: (key) => storage.delete(key),
};

const { api, getStoredProfile, multipart, setToken, setUnauthorizedHandler } = await import('../src/api.js');
const originalFetch = globalThis.fetch;

test('protected 401 notifies the session handler and rejects the request', async () => {
  let notified = 0;
  const restore = setUnauthorizedHandler(() => { notified += 1; });
  setToken('expired-token');
  globalThis.fetch = async (_url, options) => {
    assert.equal(options.headers.Authorization, 'Bearer expired-token');
    return new Response(JSON.stringify({ message: 'Sessão expirada.' }), {
      status: 401,
      headers: { 'content-type': 'application/json' },
    });
  };

  await assert.rejects(api.get('/private'), (error) => error.status === 401);
  assert.equal(notified, 1);
  restore();
});

test('login 401 does not clear a session as if it were expired', async () => {
  let notified = 0;
  const restore = setUnauthorizedHandler(() => { notified += 1; });
  setToken('old-token');
  globalThis.fetch = async (_url, options) => {
    assert.equal(options.headers.Authorization, undefined);
    return new Response(JSON.stringify({ message: 'Credenciais inválidas.' }), {
      status: 401,
      headers: { 'content-type': 'application/json' },
    });
  };

  await assert.rejects(api.post('/auth/login', { email: 'x', senha: 'x' }, { auth: false }), (error) => error.status === 401);
  assert.equal(notified, 0);
  restore();
});

test('403 does not end an authenticated session', async () => {
  let notified = 0;
  const restore = setUnauthorizedHandler(() => { notified += 1; });
  setToken('valid-token');
  globalThis.fetch = async () => new Response(JSON.stringify({ message: 'Sem permissão.' }), {
    status: 403,
    headers: { 'content-type': 'application/json' },
  });

  await assert.rejects(api.get('/restricted'), (error) => error.status === 403);
  assert.equal(notified, 0);
  restore();
});

test('PUT sends a JSON update and returns the API representation', async () => {
  setToken('building-token');
  globalThis.fetch = async (url, options) => {
    assert.equal(url, '/api/predio/12');
    assert.equal(options.method, 'PUT');
    assert.equal(options.headers.Authorization, 'Bearer building-token');
    assert.equal(options.headers['Content-Type'], 'application/json');
    assert.deepEqual(JSON.parse(options.body), { nome: 'Edifício Aurora' });
    return new Response(JSON.stringify({ id: 12, nome: 'Edifício Aurora' }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  };

  assert.deepEqual(await api.put('/predio/12', { nome: 'Edifício Aurora' }), { id: 12, nome: 'Edifício Aurora' });
});

test('PATCH sends its JSON body when the endpoint requires an update payload', async () => {
  setToken('update-token');
  globalThis.fetch = async (_url, options) => {
    assert.equal(options.method, 'PATCH');
    assert.equal(options.headers.Authorization, 'Bearer update-token');
    assert.equal(options.headers['Content-Type'], 'application/json');
    assert.deepEqual(JSON.parse(options.body), { retorno: 'FALEI' });
    return new Response(JSON.stringify({ id: 5, retorno: 'FALEI' }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  };

  assert.deepEqual(await api.patch('/contatos/5/retorno', { retorno: 'FALEI' }), { id: 5, retorno: 'FALEI' });
});

test('authenticated download returns the file blob and decoded filename', async () => {
  setToken('download-token');
  globalThis.fetch = async (_url, options) => {
    assert.equal(options.method, 'GET');
    assert.equal(options.headers.Authorization, 'Bearer download-token');
    return new Response(new Blob(['private document'], { type: 'application/pdf' }), {
      status: 200,
      headers: { 'content-type': 'application/pdf', 'content-disposition': "attachment; filename*=UTF-8''matricula%20imovel.pdf" },
    });
  };

  const result = await api.download('/imovel/7/documentos/9/arquivo');
  assert.equal(result.filename, 'matricula imovel.pdf');
  assert.equal(await result.blob.text(), 'private document');
});

test('successful list responses preserve an empty collection for the empty state', async () => {
  globalThis.fetch = async () => new Response('[]', {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });

  assert.deepEqual(await api.get('/predio'), []);
});

test('stores the returned profile with the token and clears both on logout', () => {
  setToken('current-token', 'CORRETOR');
  assert.equal(getStoredProfile(), 'CORRETOR');
  assert.equal(storage.get('mi_perfil'), 'CORRETOR');
  setToken(null);
  assert.equal(getStoredProfile(), null);
  assert.equal(storage.has('mi_perfil'), false);
});

test('multipart repeats array file parts for endpoints that accept multiple files', () => {
  const first = new Blob(['first'], { type: 'image/jpeg' });
  const second = new Blob(['second'], { type: 'image/png' });
  const form = multipart({ titulo: 'Imóvel' }, { fotos: [first, second] });
  assert.equal(form.getAll('fotos').length, 2);
  assert.equal(form.getAll('fotos')[0].size, first.size);
  assert.equal(form.getAll('fotos')[1].size, second.size);
});

test.after(() => {
  globalThis.fetch = originalFetch;
  setToken(null);
});
