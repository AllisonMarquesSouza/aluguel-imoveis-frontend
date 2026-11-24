import assert from 'node:assert/strict';
import test from 'node:test';
import { filterCities, toggleCitySelection } from '../src/city-selection.js';

const cities = [
  { id: 1, nome: 'Jaboatão dos Guararapes', uf: 'PE' },
  { id: 2, nome: 'Recife', uf: 'PE' },
  { id: 3, nome: 'Maceió', uf: 'AL' },
];

test('filters cities by name without requiring accents or matching UF', () => {
  assert.deepEqual(filterCities(cities, 'jaboatao'), [cities[0]]);
  assert.deepEqual(filterCities(cities, 'al'), [cities[2]]);
  assert.deepEqual(filterCities(cities, ''), cities);
});

test('toggles city IDs without duplicates and preserves the remaining selection', () => {
  assert.deepEqual(toggleCitySelection(['1'], 2, true), ['1', '2']);
  assert.deepEqual(toggleCitySelection(['1', '2', '2'], 2, true), ['1', '2']);
  assert.deepEqual(toggleCitySelection(['1', '2'], 1, false), ['2']);
  assert.deepEqual(toggleCitySelection(['1'], 1, false), []);
});
