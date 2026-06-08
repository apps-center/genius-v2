export const manifest = {
  id: 'chronologie',
  name: 'Chronologie Historique',
  version: '0.1.0',
  route: '/chronologie',
  icon: 'calendar',
  description: 'Frise verticale interactive : periodes, evenements, anecdotes et images.',
  contentKinds: ['chronologie'] as const, // ce que cette brique sait consommer
  niveaux: ['6e', '5e', '4e', '3e'] as const,
};

export type Manifest = typeof manifest;
