import assert from 'node:assert/strict';
import test from 'node:test';
import { filterOptions, toggleSelection } from '../src/multi-select-data.js';

const options = [
  { id: 1, label: 'Jaboatão dos Guararapes', detail: 'PE' },
  { id: 2, label: 'Recife', detail: 'PE' },
  { id: 3, label: 'Ação acessível', detail: '' },
];

test('filters options by label without requiring accents or matching secondary text', () => {
  assert.deepEqual(filterOptions(options, 'jaboatao'), [options[0]]);
  assert.deepEqual(filterOptions(options, 'acao'), [options[2]]);
  assert.deepEqual(filterOptions(options, 'pe'), [options[0], options[1]]);
  assert.deepEqual(filterOptions(options, ''), options);
});

test('toggles selected IDs without duplicates and preserves the remaining selection', () => {
  assert.deepEqual(toggleSelection(['1'], 2, true), ['1', '2']);
  assert.deepEqual(toggleSelection(['1', '2', '2'], 2, true), ['1', '2']);
  assert.deepEqual(toggleSelection(['1', '2'], 1, false), ['2']);
  assert.deepEqual(toggleSelection(['1'], 1, false), []);
});
