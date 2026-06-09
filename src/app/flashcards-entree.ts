import type { FlashcardsPack } from '../core/content/flashcards.schema';

/*
  Helpers PURS de l'ecran d'entree des Flashcards (aucun React, aucun DOM).
  Derivent l'apercu d'un deck (nombre de cartes + modele) a partir du pack DEJA
  charge et valide par Zod. La DECOUVERTE des decks, elle, vient du registre
  (ctx.content.list('flashcards')) : rien n'est code en dur ici.
*/

// Modele dominant d'un deck, deduit du champ discriminant `type` des cartes.
// 'mixte' couvre le futur Mode Genius (un deck melangeant image et question-reponse).
export type ModeleDeck = 'image' | 'qr' | 'mixte';

export interface ApercuDeck {
  nbCartes: number;
  modele: ModeleDeck;
}

// Compte les cartes et determine le modele dominant du deck.
export function apercuDeck(pack: FlashcardsPack): ApercuDeck {
  const types = new Set(pack.cartes.map((c) => c.type));
  const modele: ModeleDeck = types.size === 1 ? (types.values().next().value as ModeleDeck) : 'mixte';
  return { nbCartes: pack.cartes.length, modele };
}

// Libelle humain du modele (indice de type affiche sur la tuile).
export function libelleModele(modele: ModeleDeck): string {
  switch (modele) {
    case 'image':
      return 'Images';
    case 'qr':
      return 'Question-reponse';
    case 'mixte':
      return 'Mixte';
  }
}

// Icone d'un deck selon son modele (decor uniquement, aria-hidden cote rendu).
export function iconeModele(modele: ModeleDeck): string {
  switch (modele) {
    case 'image':
      return '🖼️';
    case 'qr':
      return '💬';
    case 'mixte':
      return '🎴';
  }
}
