import assert from 'node:assert/strict';
import test from 'node:test';
import { buildContactQuery } from '../src/contact-data.js';

test('contact filters include only selected API parameters', () => {
  assert.equal(buildContactQuery({ imovelId: '12', dataInicio: '2026-11-01', dataFim: '' }), '?imovelId=12&dataInicio=2026-11-01');
});

test('contact filters leave the query empty when no filters are selected', () => {
  assert.equal(buildContactQuery({ imovelId: '', dataInicio: '', dataFim: '' }), '');
});
