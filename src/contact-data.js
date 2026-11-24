export function buildContactQuery(filters) {
  const params = new URLSearchParams();
  if (filters.imovelId) params.set('imovelId', filters.imovelId);
  if (filters.dataInicio) params.set('dataInicio', filters.dataInicio);
  if (filters.dataFim) params.set('dataFim', filters.dataFim);
  const query = params.toString();
  return query ? `?${query}` : '';
}
