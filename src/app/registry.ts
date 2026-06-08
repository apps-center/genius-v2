import type { ContentEntry } from '../core/content/client';
import type { ContentKind } from '../core/content/load';
import * as quizBrick from '../bricks/quiz/brick';

/*
  REGISTRE - source unique de verite : briques + packs de contenu + entrees de nav.
  AJOUTER UN SUJET = 1 ligne dans CONTENT + 1 .json. ZERO code metier.
  AJOUTER UNE ACTIVITE = 1 entree dans BRICKS pointant une brique conforme 5.2.
  AJOUTER UNE ENTREE D'ACCUEIL (activite/module) = 1 declaration dans ./entries.
*/

// Niveaux 1 et 2 de la nav (accueil + ecrans d'entree). Re-exporte ici pour
// garder le registre comme facade unique de la navigation generee.
export * from './entries';

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
// Ordre chronologique : il pilote l'ordre d'affichage dans la nav (genere depuis ce registre).
// Tous ces packs partagent la matiere 'histoire' ; le `titre` les desambigue (cf. loadPack).
export const CONTENT: readonly ContentEntry[] = [
  { sujet: 'histoire', contentKind: 'qcm', titre: 'Ère cosmique', load: () => import('../content/histoire/ere-cosmique-qcm.json') },
  { sujet: 'histoire', contentKind: 'qcm', titre: 'Ère biologique', load: () => import('../content/histoire/ere-biologique-qcm.json') },
  { sujet: 'histoire', contentKind: 'qcm', titre: 'Préhistoire', load: () => import('../content/histoire/prehistoire-qcm.json') },
  { sujet: 'histoire', contentKind: 'qcm', titre: 'Premières civilisations', load: () => import('../content/histoire/premieres-civilisations-qcm.json') },
  { sujet: 'histoire', contentKind: 'qcm', titre: 'Égypte et Mésopotamie', load: () => import('../content/histoire/egypte-mesopotamie-qcm.json') },
  { sujet: 'histoire', contentKind: 'qcm', titre: 'Proche-Orient antique', load: () => import('../content/histoire/proche-orient-antique-qcm.json') },
  { sujet: 'histoire', contentKind: 'qcm', titre: 'Grèce antique', load: () => import('../content/histoire/grece-antique-qcm.json') },
  { sujet: 'histoire', contentKind: 'qcm', titre: 'Rome antique', load: () => import('../content/histoire/rome-antique-qcm.json') },
  { sujet: 'histoire', contentKind: 'qcm', titre: 'Antiquité', load: () => import('../content/histoire/antiquite-qcm.json') },
  { sujet: 'histoire', contentKind: 'qcm', titre: 'Carolingiens', load: () => import('../content/histoire/carolingiens-qcm.json') },
  { sujet: 'histoire', contentKind: 'qcm', titre: 'Capétiens', load: () => import('../content/histoire/capetiens-qcm.json') },
  { sujet: 'histoire', contentKind: 'qcm', titre: 'Moyen Âge', load: () => import('../content/histoire/moyen-age-qcm.json') },
  { sujet: 'histoire', contentKind: 'qcm', titre: 'Renaissance', load: () => import('../content/histoire/renaissance-qcm.json') },
  { sujet: 'histoire', contentKind: 'qcm', titre: 'Guerres de Religion', load: () => import('../content/histoire/guerres-de-religion-qcm.json') },
  { sujet: 'histoire', contentKind: 'qcm', titre: 'Monarchie absolue', load: () => import('../content/histoire/monarchie-absolue-qcm.json') },
  { sujet: 'histoire', contentKind: 'qcm', titre: 'Lumières', load: () => import('../content/histoire/lumieres-qcm.json') },
  { sujet: 'histoire', contentKind: 'qcm', titre: 'Révolution française', load: () => import('../content/histoire/revolution-francaise-qcm.json') },
  { sujet: 'histoire', contentKind: 'qcm', titre: 'Révolution et XIXe siècle', load: () => import('../content/histoire/revolution-xixe-siecle-qcm.json') },
  { sujet: 'histoire', contentKind: 'qcm', titre: 'Napoléon', load: () => import('../content/histoire/napoleon-qcm.json') },
  { sujet: 'histoire', contentKind: 'qcm', titre: 'XIXe siècle', load: () => import('../content/histoire/xixe-siecle-qcm.json') },
  { sujet: 'histoire', contentKind: 'qcm', titre: 'Première Guerre mondiale', load: () => import('../content/histoire/premiere-guerre-mondiale-qcm.json') },
  { sujet: 'histoire', contentKind: 'qcm', titre: 'Deuxième Guerre mondiale', load: () => import('../content/histoire/deuxieme-guerre-mondiale-qcm.json') },
  { sujet: 'histoire', contentKind: 'qcm', titre: 'France contemporaine', load: () => import('../content/histoire/france-contemporaine-qcm.json') },
  { sujet: 'histoire', contentKind: 'qcm', titre: 'Histoire du monde', load: () => import('../content/histoire/histoire-du-monde-qcm.json') },
  // { sujet: 'mathematiques', contentKind: 'qcm', titre: 'Theoreme de Pythagore',
  //   load: () => import('../content/mathematiques/pythagore-qcm.json') },
];

// Apparie chaque pack avec les briques capables de le jouer (par contentKind).
export function briquesPour(contentKind: string): BrickModule[] {
  return BRICKS.filter((b) =>
    (b.manifest.contentKinds as readonly string[]).includes(contentKind),
  );
}

// Les packs de contenu d'un contentKind donne (themes proposes a l'ecran de niveau 3).
export function packsPour(contentKind: ContentKind): ContentEntry[] {
  return CONTENT.filter((e) => e.contentKind === contentKind);
}

export function briqueParId(id: string): BrickModule | undefined {
  return BRICKS.find((b) => b.manifest.id === id);
}
