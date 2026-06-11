import type { ContentEntry } from '../core/content/client';
import type { ContentKind } from '../core/content/load';
import type { AppContext } from '../core/context';
import * as quizBrick from '../bricks/quiz/brick';
import * as chronologieBrick from '../bricks/chronologie/brick';
import * as flashcardsBrick from '../bricks/flashcards/brick';

/*
  REGISTRE - source unique de verite : briques + packs de contenu + entrees de nav.
  AJOUTER UN SUJET = 1 ligne dans CONTENT + 1 .json. ZERO code metier.
  AJOUTER UNE ACTIVITE = 1 entree dans BRICKS pointant une brique conforme 5.2.
  AJOUTER UNE ENTREE D'ACCUEIL (activite/module) = 1 declaration dans ./entries.
*/

// Niveaux 1 et 2 de la nav (accueil + ecrans d'entree). Re-exporte ici pour
// garder le registre comme facade unique de la navigation generee.
export * from './entries';

// Frontiere commune des manifests de brique (forme structurelle, tous contentKinds).
export interface BrickManifest {
  id: string;
  name: string;
  version: string;
  route: string;
  icon: string;
  description: string;
  contentKinds: readonly string[];
  niveaux: readonly string[];
}

// Une brique declaree : son manifest + sa frontiere mount/unmount.
export interface BrickModule {
  manifest: BrickManifest;
  mount: (container: HTMLElement, ctx: AppContext) => void;
  unmount: () => void;
}

export const BRICKS: readonly BrickModule[] = [
  quizBrick,
  chronologieBrick,
  flashcardsBrick,
  // <- ajouter ici logique... (1 ligne par activite)
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

  // Chronologie (frise) : une branche = un pack. Les 6 branches de l'ancien site,
  // dans l'ordre chronologique (il pilote l'ordre des onglets de la brique).
  { sujet: 'histoire', contentKind: 'chronologie', titre: 'Préhistoire', load: () => import('../content/chronologie/prehistoire.json') },
  { sujet: 'histoire', contentKind: 'chronologie', titre: 'Antiquité', load: () => import('../content/chronologie/antiquite.json') },
  { sujet: 'histoire', contentKind: 'chronologie', titre: 'Moyen Âge', load: () => import('../content/chronologie/moyenage.json') },
  { sujet: 'histoire', contentKind: 'chronologie', titre: 'Temps modernes', load: () => import('../content/chronologie/tempsmodernes.json') },
  { sujet: 'histoire', contentKind: 'chronologie', titre: 'Époque contemporaine', load: () => import('../content/chronologie/contemporaine.json') },
  { sujet: 'histoire', contentKind: 'chronologie', titre: 'Histoire du monde', load: () => import('../content/chronologie/monde.json') },

  // Flashcards : un deck = un pack. Deux pilotes, un par modele de carte :
  // 'arts' = modele IMAGE (recto image, verso fiche), 'logique' = modele QUESTION-REPONSE.
  // Jouables directement via /play/flashcards?sujet=...&titre=... (pas encore d'entree d'accueil).
  { sujet: 'arts', contentKind: 'flashcards', titre: 'Arts', load: () => import('../content/flashcards/arts.json') },
  { sujet: 'logique', contentKind: 'flashcards', titre: 'Logique', load: () => import('../content/flashcards/logique.json') },
  { sujet: 'geographie', contentKind: 'flashcards', titre: 'Géographie', load: () => import('../content/flashcards/geographie.json') },
  { sujet: 'mathematiques', contentKind: 'flashcards', titre: 'Mathématiques', load: () => import('../content/flashcards/mathematiques.json') },
  { sujet: 'sciences', contentKind: 'flashcards', titre: 'Sciences', load: () => import('../content/flashcards/sciences.json') },
  { sujet: 'histoire', contentKind: 'flashcards', titre: 'Histoire', load: () => import('../content/flashcards/histoire.json') },
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
