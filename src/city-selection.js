function normalize(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
    .trim();
}

export function filterCities(cities, query) {
  const term = normalize(query);
  if (!term) return cities;

  return cities.filter((city) => normalize(`${city.nome} ${city.uf}`).includes(term));
}

export function toggleCitySelection(currentIds, cityId, checked) {
  const selected = new Set((currentIds ?? []).map(String));
  const id = String(cityId);

  if (checked) selected.add(id);
  else selected.delete(id);

  return [...selected];
}
