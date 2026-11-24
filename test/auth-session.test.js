import assert from 'node:assert/strict';
import test from 'node:test';
import { can, canAccessPanel, readSession } from '../src/auth-session.js';
import { dashboardSourcesFor } from '../src/dashboard-metrics.js';

function tokenFor(payload) {
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `header.${encoded}.signature`;
}

test('decodes a known profile and the API subject', () => {
  const session = readSession(tokenFor({ sub: 'gestor@example.test', perfil: 'ROLE_GESTOR', exp: 2000 }), 1000);
  assert.equal(session.email, 'gestor@example.test');
  assert.equal(session.perfil, 'GESTOR');
  assert.equal(session.exp, 2000);
});

test('does not authorize an unknown or missing profile', () => {
  const session = readSession(tokenFor({ sub: 'admin@example.test', exp: 2000 }), 1000);
  assert.equal(session.perfil, null);
  assert.equal(can(session, 'ADMINISTRADOR'), false);
  assert.equal(can(null, 'ADMINISTRADOR'), false);
});

test('panel access allows only administrator, manager, and broker sessions', () => {
  assert.equal(canAccessPanel({ perfil: 'ADMINISTRADOR' }), true);
  assert.equal(canAccessPanel({ perfil: 'GESTOR' }), true);
  assert.equal(canAccessPanel({ perfil: 'CORRETOR' }), true);
  assert.equal(canAccessPanel({ perfil: 'CLIENTE' }), false);
  assert.equal(canAccessPanel({ perfil: 'DESCONHECIDO' }), false);
  assert.equal(canAccessPanel(null), false);
});

test('uses the profile returned by login when it is not in the JWT', () => {
  const session = readSession(tokenFor({ sub: 'gestor@example.test', exp: 2000 }), 1000, 'GESTOR');
  assert.equal(session.perfil, 'GESTOR');
  assert.equal(can(session, 'GESTOR'), true);
  assert.equal(can(session, 'ADMINISTRADOR'), false);
});

test('rejects malformed, expired, and non-expiring tokens', () => {
  assert.equal(readSession('not-a-jwt'), null);
  assert.equal(readSession(tokenFor({ perfil: 'GESTOR', exp: 1000 }), 1_000_000), null);
  assert.equal(readSession(tokenFor({ perfil: 'GESTOR' }), 1000), null);
});

test('dashboard sources match the documented profile scope', () => {
  assert.deepEqual(dashboardSourcesFor('ADMINISTRADOR').map((source) => source.path), ['/empresa', '/cidade']);
  assert.deepEqual(dashboardSourcesFor('GESTOR'), []);
  assert.deepEqual(dashboardSourcesFor('CORRETOR').map((source) => source.path), ['/imovel']);
  assert.deepEqual(dashboardSourcesFor('CLIENTE'), []);
});
