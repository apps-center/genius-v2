export const manifest = {
  id: 'atlas',
  name: 'Atlas Geopolitique',
  version: '0.1.0',
  route: '/atlas',
  icon: 'globe',
  description:
    'Carte du monde interactive : zoom, deplacement, fiches pays et couches thematiques (climat, ressources, routes maritimes).',
  contentKinds: ['atlas'] as const, // ce que cette brique sait consommer
  niveaux: ['6e', '5e', '4e', '3e'] as const,
};

export type Manifest = typeof manifest;
