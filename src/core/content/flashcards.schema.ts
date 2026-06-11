import { z } from 'zod';

/*
  Schema Zod du contentKind 'flashcards'. Securise chaque deck AVANT usage.
  UN schema, DEUX modeles de carte qui coexistent dans le legacy, distingues par le
  champ DISCRIMINANT `type` :
   - 'image' : recto = image plein cadre, verso = epoque + date + titre + description
     (utilise par histoire, arts...).
   - 'qr'    : recto = question (+ categorie), verso = reponse + explication
     (utilise par maths, logique...).

  Un deck peut, a terme, melanger les deux modeles (couture reservee pour le futur Mode
  Genius) ; les deux packs pilotes sont homogenes. logic/ et ui/ ne connaissent QUE la
  forme typee deduite ici, jamais un fichier precis ni un sujet donne.

  ILLUSTRATION OPTIONNELLE (modele 'qr') : une carte question-reponse peut, plus tard,
  porter un visuel d'appoint, soit une image bitmap (champ `src`, URL racine vers public/,
  comme le modele image), soit un SVG inline (champ `svg`, issu de NOTRE contenu valide).
  Le champ est ENTIEREMENT optionnel : une carte qr sans illustration reste valide, a
  l'identique de l'existant. On prepare l'architecture sans remplir les illustrations.
*/

// Visuel optionnel d'une carte qr, forme discriminee par `type` (bitmap OU svg inline).
export const IllustrationImage = z.object({
  type: z.literal('image'),
  // URL racine vers public/, ex. "/img/flashcards/geographie/xxx.webp". Servie sans rognage.
  src: z.string().min(1),
});

export const IllustrationSvg = z.object({
  type: z.literal('svg'),
  // Markup SVG inline issu de nos packs (valide Zod, rendu de maniere maitrisee cote ui/).
  svg: z.string().min(1),
});

export const Illustration = z.discriminatedUnion('type', [IllustrationImage, IllustrationSvg]);

export const FlashcardImage = z.object({
  type: z.literal('image'),
  id: z.string().min(1),
  // URL racine vers public/, ex. "/img/flashcards/arts/xxx.webp". Image servie sans
  // rognage (hauteur auto cote rendu), comme sur la frise chronologie.
  image: z.string().min(1),
  titre: z.string().min(1),
  date: z.string().min(1),
  epoque: z.string().optional(),
  description: z.string().min(1),
});

export const FlashcardQr = z.object({
  type: z.literal('qr'),
  id: z.string().min(1),
  question: z.string().min(1),
  reponse: z.string().min(1),
  explication: z.string().optional(),
  categorie: z.string().optional(),
  // Difficulte indicative (1 = facile, 3 = difficile). Reservee pour de futurs filtres.
  difficulte: z.number().int().min(1).max(3).optional(),
  // Visuel d'appoint OPTIONNEL (bitmap ou svg). Absent = carte texte seul (cas actuel).
  illustration: Illustration.optional(),
});

export const Flashcard = z.discriminatedUnion('type', [FlashcardImage, FlashcardQr]);

export const FlashcardsPack = z.object({
  contentKind: z.literal('flashcards'),
  sujet: z.string().min(1),
  titre: z.string().min(1),
  cartes: z.array(Flashcard).min(1),
});

export type Illustration = z.infer<typeof Illustration>;
export type FlashcardImage = z.infer<typeof FlashcardImage>;
export type FlashcardQr = z.infer<typeof FlashcardQr>;
export type Flashcard = z.infer<typeof Flashcard>;
export type FlashcardsPack = z.infer<typeof FlashcardsPack>;
