const text = (value) => value == null ? '' : String(value);

export function buildingFormFromResponse(building) {
  const address = building.endereco || {};
  return {
    nome: building.nome || '',
    cidadeId: text(address.cidadeId),
    cep: address.cep || '',
    logradouro: address.logradouro || '',
    numero: address.numero || '',
    complemento: address.complemento || '',
    bairro: address.bairro || '',
    latitude: text(address.latitude),
    longitude: text(address.longitude),
    numeroAndares: text(building.numeroAndares),
    unidadesPorAndar: text(building.unidadesPorAndar),
    anoConstrucao: text(building.anoConstrucao ?? 0),
    elevadores: text(building.elevadores ?? 0),
    portaria24h: Boolean(building.portaria24h),
    piscina: Boolean(building.piscina),
    academia: Boolean(building.academia),
    salaoFestas: Boolean(building.salaoFestas),
    playground: Boolean(building.playground),
    valorCondominioBase: text(building.valorCondominioBase ?? 0),
  };
}

export function buildBuildingDto(form) {
  return {
    nome: form.nome.trim(),
    endereco: {
      cep: form.cep.trim(),
      logradouro: form.logradouro.trim(),
      numero: form.numero.trim(),
      complemento: form.complemento.trim() || null,
      bairro: form.bairro.trim(),
      cidadeId: Number(form.cidadeId),
      latitude: Number(form.latitude),
      longitude: Number(form.longitude),
    },
    numeroAndares: Number(form.numeroAndares),
    unidadesPorAndar: Number(form.unidadesPorAndar),
    anoConstrucao: Number(form.anoConstrucao),
    elevadores: Number(form.elevadores),
    portaria24h: form.portaria24h,
    piscina: form.piscina,
    academia: form.academia,
    salaoFestas: form.salaoFestas,
    playground: form.playground,
    valorCondominioBase: Number(form.valorCondominioBase),
  };
}
