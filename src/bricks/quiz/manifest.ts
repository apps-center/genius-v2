export const manifest = {
  id: 'quiz',
  name: 'Quiz',
  version: '0.1.0',
  route: '/quiz',
  icon: 'help-circle',
  description: 'QCM tires aleatoirement. Reponds, decouvre la bonne reponse, accumule les points.',
  contentKinds: ['qcm'] as const, // ce que cette brique sait consommer
  niveaux: ['6e', '5e', '4e', '3e'] as const,
};

export type Manifest = typeof manifest;
