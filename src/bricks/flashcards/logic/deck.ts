/*
  Mecanique PURE d'un deck de flashcards : navigation et retournement. ZERO React, ZERO DOM.
  Testable seule (vitest). L'etat ne contient que des index et un booleen de face : le
  rendu (image vs question-reponse) est decide par ui/ a partir du `type` de la carte.

  Perimetre volontairement reduit a "un deck qui se joue". Les coutures pour le futur
  (melange, filtres par categorie/niveau, mode Genius) ne sont PAS implementees ici ;
  l'etat reste minimal pour les accueillir sans rupture.
*/

export interface DeckState {
  position: number; // index de la carte courante (0..total-1)
  total: number; // nombre de cartes du deck
  revelee: boolean; // true = verso visible, false = recto
}

export function initDeck(total: number): DeckState {
  if (total < 1) throw new Error('Un deck doit contenir au moins une carte.');
  return { position: 0, total, revelee: false };
}

// Retourne la carte courante (recto <-> verso) sans changer de position.
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

export const estPremiere = (s: DeckState): boolean => s.position <= 0;
export const estDerniere = (s: DeckState): boolean => s.position >= s.total - 1;

// Numero affichable de la carte courante (1..total) pour l'indicateur de progression.
export const numeroCarte = (s: DeckState): number => s.position + 1;
