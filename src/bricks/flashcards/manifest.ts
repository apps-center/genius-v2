export const manifest = {
  id: 'flashcards',
  name: 'Flashcards',
  version: '0.1.0',
  route: '/flashcards',
  icon: 'cards',
  description:
    'Cartes recto/verso a retourner : image ou question-reponse, navigation et progression.',
  contentKinds: ['flashcards'] as const, // ce que cette brique sait consommer
  niveaux: ['6e', '5e', '4e', '3e'] as const,
};

export type Manifest = typeof manifest;
