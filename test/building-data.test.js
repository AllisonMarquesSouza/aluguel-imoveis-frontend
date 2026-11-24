import assert from 'node:assert/strict';
import test from 'node:test';
import { buildBuildingDto, buildingFormFromResponse } from '../src/building-data.js';

const form = {
  nome: '  Edifício Aurora  ',
  cidadeId: '3',
  cep: '50000000',
  logradouro: ' Rua A ',
  numero: ' 120 ',
  complemento: '  Bloco B  ',
  bairro: ' Centro ',
  latitude: '-8.05',
  longitude: '-34.9',
  numeroAndares: '12',
  unidadesPorAndar: '4',
  anoConstrucao: '2019',
  elevadores: '2',
  portaria24h: true,
  piscina: false,
  academia: true,
  salaoFestas: false,
  playground: true,
  valorCondominioBase: '850.75',
};

test('building form creates the API DTO with normalized text and numeric fields', () => {
  assert.deepEqual(buildBuildingDto(form), {
    nome: 'Edifício Aurora',
    endereco: {
      cep: '50000000',
      logradouro: 'Rua A',
      numero: '120',
      complemento: 'Bloco B',
      bairro: 'Centro',
      cidadeId: 3,
      latitude: -8.05,
      longitude: -34.9,
    },
    numeroAndares: 12,
    unidadesPorAndar: 4,
    anoConstrucao: 2019,
    elevadores: 2,
    portaria24h: true,
    piscina: false,
    academia: true,
    salaoFestas: false,
    playground: true,
    valorCondominioBase: 850.75,
  });
});

test('building response repopulates the edit form and preserves optional and boolean values', () => {
  const response = {
    nome: 'Edifício Aurora',
    endereco: {
      cidadeId: 3,
      cep: '50000000',
      logradouro: 'Rua A',
      numero: '120',
      complemento: null,
      bairro: 'Centro',
      latitude: -8.05,
      longitude: -34.9,
    },
    numeroAndares: 12,
    unidadesPorAndar: 4,
    anoConstrucao: 2019,
    elevadores: 2,
    portaria24h: false,
    piscina: true,
    academia: false,
    salaoFestas: true,
    playground: false,
    valorCondominioBase: 850.75,
  };

  assert.deepEqual(buildingFormFromResponse(response), {
    ...form,
    nome: 'Edifício Aurora',
    cidadeId: '3',
    cep: '50000000',
    logradouro: 'Rua A',
    numero: '120',
    complemento: '',
    bairro: 'Centro',
    latitude: '-8.05',
    longitude: '-34.9',
    numeroAndares: '12',
    unidadesPorAndar: '4',
    anoConstrucao: '2019',
    elevadores: '2',
    portaria24h: false,
    piscina: true,
    academia: false,
    salaoFestas: true,
    playground: false,
    valorCondominioBase: '850.75',
  });
});

test('building form sends null for an optional blank complement', () => {
  assert.equal(buildBuildingDto({ ...form, complemento: '  ' }).endereco.complemento, null);
});
