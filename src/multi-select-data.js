function normalize(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
    .trim();
}

export function filterOptions(options, query) {
  const term = normalize(query);
  if (!term) return options;

  return options.filter((option) => normalize(`${option.label} ${option.detail ?? ''}`).includes(term));
}

export function toggleSelection(currentIds, optionId, checked) {
  const selected = new Set((currentIds ?? []).map(String));
  const id = String(optionId);

  if (checked) selected.add(id);
  else selected.delete(id);

  return [...selected];
}
