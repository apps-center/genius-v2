import type { ContentKind } from '../core/content/load';

/*
  ENTREES DE NAVIGATION - niveaux 1 et 2 de la coquille (distinctes des packs de CONTENU).
  Source unique de verite de l'accueil et des ecrans d'entree : la nav est GENEREE d'ici.
  Ajouter une activite ou un module = ajouter une declaration ci-dessous, zero composant touche.

  Modele a trois niveaux (cf. docs/audit-legacy.md) :
   1. Accueil  : deux sections ("entrainement", "modules") listant les NavEntry.
   2. Activite : ecran d'entree par NavEntry (modes pour le Quiz, sinon placeholder "a venir").
   3. Mode     : ecran de choix du theme pour un mode jouable (branche une brique + un contentKind).

  Cette declaration ne contient AUCUN contenu reel : un module non migre reste 'a-venir' et
  ne branche ni brique ni pack (pas de fausse donnee, pas de compteur invente).
*/

export type EtatEntree = 'disponible' | 'a-venir';
export type SectionAccueil = 'entrainement' | 'modules';

// Lancement direct d'une brique depuis l'accueil (cas des modules : on va droit a la
// brique, sans ecran d'entree intermediaire, conformement a l'audit). Identifie le pack
// a jouer (sujet + titre) que la brique chargera via ctx.content.
export interface LancementDirect {
  brickId: string;
  contentKind: ContentKind;
  sujet: string;
  titre: string;
}

// Ecran d'entree "grille de decks" : niveau 2 qui DECOUVRE ses decks depuis le
// registre (les packs du `contentKind`) et lance la `brique` au clic. Aucun deck
// n'est liste ici : ajouter un deck = 1 ligne de CONTENT, zero code dans l'ecran.
export interface GrilleDecks {
  brickId: string;
  contentKind: ContentKind;
}

// Un mode au sein d'une activite (ex. les 3 modes du Quiz : Questions / Dates / Images).
export interface ModeEntree {
  id: string;
  titre: string;
  icone: string;
  description: string;
  badge: string;
  etat: EtatEntree;
  // Renseignes UNIQUEMENT si le mode est jouable : la brique a monter et le
  // contentKind dont l'ecran de niveau 3 fait choisir un theme.
  brickId?: string;
  contentKind?: ContentKind;
}

// Une entree d'accueil : activite d'entrainement OU module interactif.
export interface NavEntry {
  id: string;
  section: SectionAccueil;
  ordre: number; // ordre d'affichage dans sa section
  titre: string;
  icone: string;
  sousTitre?: string; // present sur les 2 activites d'entrainement (cf. audit)
  description: string;
  tags: readonly string[];
  // 'disponible' = l'ecran de niveau 2 est fonctionnel ; sinon 'a-venir' (placeholder).
  etat: EtatEntree;
  // Present quand l'ecran de niveau 2 propose des modes (sinon : simple placeholder).
  modes?: readonly ModeEntree[];
  // Present quand l'entree lance directement une brique (modules : pas d'ecran de modes).
  lancement?: LancementDirect;
  // Present quand l'ecran de niveau 2 est une grille de decks decouverte du registre.
  grille?: GrilleDecks;
}

export const ENTRIES: readonly NavEntry[] = [
  // --- Section "Entrainement" : 2 grandes activites ---
  {
    id: 'flashcards',
    section: 'entrainement',
    ordre: 1,
    titre: 'Flashcards',
    icone: '🃏',
    sousTitre: 'Teste tes connaissances',
    description:
      'Retourne les cartes, memorise les reponses, accumule les points. Mode ⚡ Genius pour tout melanger.',
    tags: ['Arts', 'Logique'],
    etat: 'disponible',
    // Niveau 2 = grille de decks decouverte du registre (packs 'flashcards'),
    // chaque deck lance la brique flashcards. Ajouter un deck = 1 ligne de CONTENT.
    grille: { brickId: 'flashcards', contentKind: 'flashcards' },
  },
  {
    id: 'quiz',
    section: 'entrainement',
    ordre: 2,
    titre: 'Quiz',
    icone: '🎯',
    sousTitre: '10 questions, une recompense',
    description:
      'QCM tires aleatoirement - tu dois finir pour obtenir ton score et decrocher ton trophee.',
    tags: ['QCM', 'Dates', '🏆 Recompense'],
    etat: 'disponible',
    modes: [
      {
        id: 'questions',
        titre: 'Quiz Questions',
        icone: '🎯',
        description:
          '10 QCM tires aleatoirement - 4 choix par question. Reponds, decouvre la bonne reponse, et accumule les points.',
        badge: 'QCM · 4 choix · Histoire',
        etat: 'disponible',
        brickId: 'quiz',
        contentKind: 'qcm',
      },
      {
        id: 'dates',
        titre: 'Quiz Dates',
        icone: '🗓️',
        description:
          "Un evenement historique s'affiche - tu dois retrouver son siecle ou son annee. Teste ta memoire des reperes chronologiques.",
        badge: 'QCM · Chronologie · Epoque',
        etat: 'a-venir',
      },
      {
        id: 'images',
        titre: 'Quiz Images',
        icone: '🖼️',
        description:
          "Une image historique - devine l'annee de l'evenement. Entree libre : plus tu es precis, plus tu marques de points !",
        badge: 'Libre · Dates · /20 points',
        etat: 'a-venir',
      },
    ],
  },

  // --- Section "Modules interactifs" : 6 modules de savoir (ordre exact de l'audit) ---
  {
    id: 'chronologie',
    section: 'modules',
    ordre: 1,
    titre: 'Chronologie Historique',
    icone: '📜',
    description:
      "Remonte le temps des grandes civilisations jusqu'a l'epoque contemporaine. Empires, revolutions, decouvertes - toute l'histoire du monde sur une frise interactive.",
    tags: ['Antiquite', 'Moyen Age', 'Moderne', 'Contemporain'],
    etat: 'disponible',
    // Migration pilote : seule la branche Antiquite est encore migree.
    lancement: {
      brickId: 'chronologie',
      contentKind: 'chronologie',
      sujet: 'histoire',
      titre: 'Antiquité',
    },
  },
  {
    id: 'atlas',
    section: 'modules',
    ordre: 2,
    titre: 'Atlas Geopolitique',
    icone: '🌍',
    description:
      "Explore les nations, les continents et les grandes dynamiques economiques mondiales. Superficie, population, PIB, richesses naturelles - la Terre comme tu ne l'as jamais vue.",
    tags: ['Geographie', 'Economie', 'Capitales', 'Continents'],
    etat: 'a-venir',
  },
  {
    id: 'arts',
    section: 'modules',
    ordre: 3,
    titre: 'Arts & Culture',
    icone: '🎨',
    description:
      'Voyage a travers les grands mouvements artistiques - Renaissance, Baroque, Impressionnisme, Modernisme. OEuvres, artistes, fiches et galerie interactive.',
    tags: ['Peinture', 'Musique', 'Litterature', 'Frise'],
    etat: 'a-venir',
  },
  {
    id: 'logique',
    section: 'modules',
    ordre: 4,
    titre: 'Logique & Raisonnement',
    icone: '🧠',
    description:
      "Suites, syllogismes, probabilites, enigmes - 25 exercices progressifs avec correction etape par etape. Entraine-toi comme pour un vrai concours.",
    tags: ['Suites', 'Deduction', 'Enigmes', 'Progressif'],
    etat: 'a-venir',
  },
  {
    id: 'mathematiques',
    section: 'modules',
    ordre: 5,
    titre: 'Mathematiques',
    icone: '🔢',
    description:
      "Des os d'Ishango au paradoxe de Cantor - frise des decouvertes, demonstrations SVG animees, anecdotes et enigmes. Pythagore, Gauss, Euler, et bien d'autres.",
    tags: ['Frise', 'Demonstrations', 'Enigmes', 'Histoire'],
    etat: 'a-venir',
  },
  {
    id: 'sciences',
    section: 'modules',
    ordre: 6,
    titre: 'Sciences & Nature',
    icone: '🔬',
    description:
      "D'Archimede a Hubble - frise chronologique, experiences emblematiques en SVG, anecdotes sur Darwin, Curie, Pasteur, Einstein. La science racontee comme une aventure.",
    tags: ['Frise', 'Experiences', 'Anecdotes', 'Enigmes'],
    etat: 'a-venir',
  },
];

// Les entrees d'une section, triees par ordre d'affichage.
export function entreesParSection(section: SectionAccueil): NavEntry[] {
  return ENTRIES.filter((e) => e.section === section).sort((a, b) => a.ordre - b.ordre);
}

export function entreeParId(id: string): NavEntry | undefined {
  return ENTRIES.find((e) => e.id === id);
}

export function modeParId(entree: NavEntry, modeId: string): ModeEntree | undefined {
  return entree.modes?.find((m) => m.id === modeId);
}

// Libelle humain d'une section (utilise par l'accueil et l'en-tete de niveau 2).
export function libelleSection(section: SectionAccueil): string {
  return section === 'entrainement' ? 'Entrainement' : 'Modules interactifs';
}
