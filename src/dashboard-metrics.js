const SOURCES = {
  ADMINISTRADOR: [
    { label: 'Empresas', path: '/empresa' },
    { label: 'Cidades', path: '/cidade' },
  ],
  GESTOR: [],
  CORRETOR: [
    { label: 'Imóveis da sua empresa', path: '/imovel' },
  ],
};

export function dashboardSourcesFor(perfil) {
  return SOURCES[perfil] ?? [];
}
