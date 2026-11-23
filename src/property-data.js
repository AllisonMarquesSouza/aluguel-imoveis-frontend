const numberOrNull = (value) => value === '' || value === null || value === undefined
  ? null
  : Number(value);

const optionalText = (value) => value?.trim() || null;

function addressDto(form) {
  return {
    cep: form.cep.trim(),
    logradouro: form.logradouro.trim(),
    numero: form.numero.trim(),
    complemento: optionalText(form.complemento),
    bairro: form.bairro.trim(),
    cidadeId: Number(form.cidadeId),
    latitude: numberOrNull(form.latitude),
    longitude: numberOrNull(form.longitude),
  };
}

function houseDto(form) {
  return {
    areaTerreno: numberOrNull(form.areaTerreno),
    areaConstruida: numberOrNull(form.areaConstruida),
    quartos: numberOrNull(form.quartos),
    suites: numberOrNull(form.suites),
    banheiros: numberOrNull(form.banheiros),
    salas: numberOrNull(form.salas),
    vagas: numberOrNull(form.vagas),
    pavimentos: numberOrNull(form.pavimentos),
    anoConstrucao: numberOrNull(form.anoConstrucao),
    piscina: form.piscina,
    quintal: form.quintal,
    churrasqueira: form.churrasqueira,
    mobiliada: form.mobiliada,
  };
}

function landDto(form) {
  return {
    areaTotal: numberOrNull(form.areaTotal),
    frente: numberOrNull(form.frente),
    fundo: numberOrNull(form.fundo),
    lateralEsquerda: numberOrNull(form.lateralEsquerda),
    lateralDireita: numberOrNull(form.lateralDireita),
    topografia: form.topografia,
    muro: form.muro,
    esquina: form.esquina,
    usoPermitido: form.usoPermitido.trim(),
  };
}

function apartmentDto(form) {
  return {
    predioId: Number(form.predioId),
    andar: numberOrNull(form.andar),
    numero: form.numeroUnidade.trim(),
    areaPrivativa: numberOrNull(form.areaPrivativa),
    areaTotal: numberOrNull(form.areaTotal),
    quartos: numberOrNull(form.quartos),
    suites: numberOrNull(form.suites),
    banheiros: numberOrNull(form.banheiros),
    vagas: numberOrNull(form.vagas),
    varanda: form.varanda,
    posicaoSolar: form.posicaoSolar.trim(),
  };
}

function lotDto(form) {
  return {
    quadraId: Number(form.quadraId),
    numero: form.numeroLote.trim(),
    area: numberOrNull(form.areaLote),
    frente: numberOrNull(form.frenteLote),
    fundo: numberOrNull(form.fundoLote),
    condicoesParcelamento: form.condicoesParcelamento.trim(),
  };
}

export function buildPropertyDto(form, nature, featureIds, photoCoverOrder) {
  const dto = {
    codigo: form.codigo.trim(),
    titulo: form.titulo.trim(),
    proprietarioId: Number(form.proprietarioId),
    finalidade: form.finalidade,
    valorVenda: numberOrNull(form.valorVenda),
    valorAluguel: numberOrNull(form.valorAluguel),
    valorCondominio: numberOrNull(form.valorCondominio),
    valorIptu: numberOrNull(form.valorIptu),
    descricao: optionalText(form.descricao),
    natureza: nature,
    caracteristicasIds: featureIds.map(Number),
    fotoCapaOrdem: photoCoverOrder,
  };

  if (nature === 'CASA') {
    dto.casa = houseDto(form);
    dto.endereco = addressDto(form);
  } else if (nature === 'TERRENO') {
    dto.terreno = landDto(form);
    dto.endereco = addressDto(form);
  } else if (nature === 'APARTAMENTO') {
    dto.apartamento = apartmentDto(form);
  } else if (nature === 'LOTE') {
    dto.lote = lotDto(form);
    dto.endereco = addressDto(form);
  }

  return dto;
}
