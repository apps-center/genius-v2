/*
  Mecanique PURE d'un deck de flashcards : navigation, retournement et ordre d'affichage.
  ZERO React, ZERO DOM. Testable seule (vitest). L'etat ne contient que des index, un
  ordre d'affichage et un booleen de face : le rendu (image vs question-reponse) est decide
  par ui/ a partir du `type` de la carte.

  ORDRE D'AFFICHAGE : `ordre` est une permutation des indices du pack d'origine. La position
  courante indexe `ordre`, jamais le pack directement : melanger ne fait que reordonner cette
  liste d'index, le pack de contenu n'est JAMAIS mute. Par defaut `ordre` vaut l'identite
  [0, 1, ... total-1] : le deck defile dans l'ordre original du pack (comportement par defaut).
*/

export interface DeckState {
  ordre: number[]; // ordre d'AFFICHAGE : indices dans le pack d'origine (jamais mute le pack)
  position: number; // index DANS `ordre` de la carte courante (0..total-1)
  total: number; // nombre de cartes du deck
  revelee: boolean; // true = verso visible, false = recto
  melange: boolean; // true = ordre aleatoire actif, false = ordre original du pack
}

// Ordre identite [0..total-1] : l'ordre original du pack, neuf a chaque appel.
function ordreIdentite(total: number): number[] {
  return Array.from({ length: total }, (_, i) => i);
}

// Melange de Fisher-Yates (non biaise) sur une copie : chaque permutation est equiprobable.
// `rng` injectable (defaut Math.random) pour des tests deterministes et reproductibles.
function fisherYates(source: number[], rng: () => number): number[] {
  const out = [...source];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = out[i]!;
    out[i] = out[j]!;
    out[j] = tmp;
  }
  return out;
}

export function initDeck(total: number): DeckState {
  if (total < 1) throw new Error('Un deck doit contenir au moins une carte.');
  return { ordre: ordreIdentite(total), position: 0, total, revelee: false, melange: false };
}

// Index de la carte courante DANS LE PACK d'origine (a travers l'ordre d'affichage).
export const indexCourant = (s: DeckState): number => s.ordre[s.position] ?? -1;

// Retourne la carte courante (recto <-> verso) sans changer de position ni d'ordre.
export function retourner(s: DeckState): DeckState {
  return { ...s, revelee: !s.revelee };
}

// Carte suivante : avance d'un cran (borne a la derniere) et repose la carte sur le recto.
export function suivante(s: DeckState): DeckState {
  const position = Math.min(s.position + 1, s.total - 1);
  return { ...s, position, revelee: false };
}

// Carte precedente : recule d'un cran (borne a la premiere) et repose sur le recto.
export function precedente(s: DeckState): DeckState {
  const position = Math.max(s.position - 1, 0);
  return { ...s, position, revelee: false };
}

// Active l'ordre aleatoire : tire un NOUVEL ordre (Fisher-Yates), revient a la carte 1 sur le
// recto. Re-appeler en mode melange retire un autre ordre. Ne mute ni l'etat ni le pack source.
export function melanger(s: DeckState, rng: () => number = Math.random): DeckState {
  const ordre = fisherYates(ordreIdentite(s.total), rng);
  return { ...s, ordre, position: 0, revelee: false, melange: true };
}

// Restaure l'ordre original du pack, revient a la carte 1 sur le recto.
export function ordreNormal(s: DeckState): DeckState {
  return { ...s, ordre: ordreIdentite(s.total), position: 0, revelee: false, melange: false };
}

export const estPremiere = (s: DeckState): boolean => s.position <= 0;
export const estDerniere = (s: DeckState): boolean => s.position >= s.total - 1;

// Numero affichable de la carte courante (1..total) pour l'indicateur de progression.
export const numeroCarte = (s: DeckState): number => s.position + 1;
