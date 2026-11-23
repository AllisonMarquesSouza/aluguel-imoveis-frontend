import assert from 'node:assert/strict';
import test from 'node:test';
import { buildPropertyDto } from '../src/property-data.js';

const form = {
  codigo: 'IM-12', titulo: 'Imóvel teste', proprietarioId: '8', finalidade: 'VENDA_E_ALUGUEL',
  valorVenda: '100000.25', valorAluguel: '1200', valorCondominio: '', valorIptu: '200',
  descricao: '', cep: '50000000', logradouro: 'Rua A', numero: '10', complemento: '',
  bairro: 'Centro', cidadeId: '3', latitude: '-8.05', longitude: '-34.9',
  areaTerreno: '200', areaConstruida: '120', quartos: '3', suites: '1', banheiros: '2',
  salas: '1', vagas: '2', pavimentos: '2', anoConstrucao: '2020', piscina: false,
  quintal: true, churrasqueira: false, mobiliada: false, areaTotal: '300', frente: '10',
  fundo: '10', lateralEsquerda: '30', lateralDireita: '30', topografia: 'PLANO', muro: true,
  esquina: false, usoPermitido: 'Residencial', predioId: '5', andar: '4', numeroUnidade: '402',
  areaPrivativa: '90', varanda: true, posicaoSolar: 'Nascente', quadraId: '6', numeroLote: '12',
  areaLote: '250', frenteLote: '10', fundoLote: '10', condicoesParcelamento: 'À vista',
};

test('CASA DTO includes casa data and address only', () => {
  const dto = buildPropertyDto(form, 'CASA', ['1', '2'], 2);
  assert.equal(dto.proprietarioId, 8);
  assert.equal(dto.valorVenda, 100000.25);
  assert.equal(dto.valorCondominio, null);
  assert.deepEqual(dto.caracteristicasIds, [1, 2]);
  assert.equal(dto.fotoCapaOrdem, 2);
  assert.equal(dto.endereco.cidadeId, 3);
  assert.equal(dto.casa.areaConstruida, 120);
  assert.equal('terreno' in dto, false);
  assert.equal('apartamento' in dto, false);
  assert.equal('lote' in dto, false);
});

test('TERRENO DTO includes only terreno data and address', () => {
  const dto = buildPropertyDto(form, 'TERRENO', [], 1);
  assert.equal(dto.terreno.topografia, 'PLANO');
  assert.equal(dto.endereco.logradouro, 'Rua A');
  assert.equal('casa' in dto, false);
  assert.equal('apartamento' in dto, false);
  assert.equal('lote' in dto, false);
});

test('APARTAMENTO DTO includes unit data and does not send separate address', () => {
  const dto = buildPropertyDto(form, 'APARTAMENTO', [], 1);
  assert.equal(dto.apartamento.predioId, 5);
  assert.equal(dto.apartamento.numero, '402');
  assert.equal(dto.apartamento.areaPrivativa, 90);
  assert.equal('endereco' in dto, false);
  assert.equal('casa' in dto, false);
  assert.equal('terreno' in dto, false);
  assert.equal('lote' in dto, false);
});

test('LOTE DTO includes lot, quadra and address data only', () => {
  const dto = buildPropertyDto(form, 'LOTE', [], 1);
  assert.equal(dto.lote.quadraId, 6);
  assert.equal(dto.lote.numero, '12');
  assert.equal(dto.lote.area, 250);
  assert.equal(dto.endereco.cidadeId, 3);
  assert.equal('casa' in dto, false);
  assert.equal('terreno' in dto, false);
  assert.equal('apartamento' in dto, false);
});
