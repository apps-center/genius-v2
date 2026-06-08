import type { ContentEntry } from '../core/content/client';
import * as quizBrick from '../bricks/quiz/brick';

/*
  REGISTRE - source unique de verite : briques + packs de contenu.
  AJOUTER UN SUJET = 1 ligne dans CONTENT + 1 .json. ZERO code metier.
  AJOUTER UNE ACTIVITE = 1 entree dans BRICKS pointant une brique conforme 5.2.
*/

// Une brique declaree : son manifest + sa frontiere mount/unmount.
export interface BrickModule {
  manifest: typeof quizBrick.manifest;
  mount: typeof quizBrick.mount;
  unmount: typeof quizBrick.unmount;
}

export const BRICKS: readonly BrickModule[] = [
  quizBrick,
  // <- ajouter ici flashcards, timeline, logique... (1 ligne par activite)
];

// Packs de contenu. Le .json est valide par Zod au chargement (jamais en dur dans le JSX).
export const CONTENT: readonly ContentEntry[] = [
  {
    sujet: 'histoire',
    contentKind: 'qcm',
    titre: 'Antiquite',
    load: () => import('../content/histoire/antiquite-qcm.json'),
  },
  // { sujet: 'mathematiques', contentKind: 'qcm', titre: 'Theoreme de Pythagore',
  //   load: () => import('../content/mathematiques/pythagore-qcm.json') },
];

// Apparie chaque pack avec les briques capables de le jouer (par contentKind).
export function briquesPour(contentKind: string): BrickModule[] {
  return BRICKS.filter((b) =>
    (b.manifest.contentKinds as readonly string[]).includes(contentKind),
  );
}

export function briqueParId(id: string): BrickModule | undefined {
  return BRICKS.find((b) => b.manifest.id === id);
}
