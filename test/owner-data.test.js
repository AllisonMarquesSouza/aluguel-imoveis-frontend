import assert from 'node:assert/strict';
import test from 'node:test';
import { buildOwnerSearchPath } from '../src/owner-data.js';

test('builds a name search path with an empty query to list authorized owners', () => {
  assert.equal(buildOwnerSearchPath(''), '/proprietario?nome=');
  assert.equal(buildOwnerSearchPath('   '), '/proprietario?nome=');
});

test('trims and encodes a name search query', () => {
  assert.equal(buildOwnerSearchPath(' Ana Souza '), '/proprietario?nome=Ana%20Souza');
});
