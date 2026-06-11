import { describe, it, expect } from 'vitest';
import { CONTENT } from './registry';
import { entreeParId } from './entries';
import { createContentClient } from '../core/content/client';
import { parsePack } from '../core/content/load';
import { apercuDeck, libelleModele, iconeModele } from './flashcards-entree';

/*
  Ecran d'entree des Flashcards : on verifie que la grille LISTE bien les decks
  PRESENTS DANS LE REGISTRE (decouverte via ctx.content.list('flashcards')), et que
  l'apercu (nombre de cartes + modele) derive du pack reel. Aucun deck n'est code en
  dur : c'est exactement la liste du registre qui pilote la grille. Ajouter un deck au
  registre l'ajoute a cette suite (aucune liste a maintenir ici).
*/

// La grille decouvre ses decks par le meme chemin que l'ecran : content.list('flashcards').
const client = createContentClient(CONTENT);
const decks = client.list('flashcards');

describe('ecran d entree flashcards : decouverte des decks', () => {
  it('liste exactement les decks flashcards declares au registre', () => {
    const duRegistre = CONTENT.filter((e) => e.contentKind === 'flashcards').map((e) => e.titre);
    expect(decks.map((d) => d.titre)).toEqual(duRegistre);
  });

  it('expose aujourd hui les decks Arts, Logique et Geographie (sujet + titre lus du registre)', () => {
    expect(decks.map((d) => `${d.sujet}:${d.titre}`).sort()).toEqual([
      'arts:Arts',
      'geographie:Géographie',
      'logique:Logique',
    ]);
  });

  it('chaque deck porte les coordonnees (sujet, titre) qui lancent la brique sans URL manuelle', () => {
    for (const deck of decks) {
      expect(deck.sujet.length).toBeGreaterThan(0);
      expect(deck.titre.length).toBeGreaterThan(0);
      expect(deck.contentKind).toBe('flashcards');
    }
  });

  it('l entree d accueil Flashcards branche la grille sur le contentKind flashcards', () => {
    const fc = entreeParId('flashcards');
    expect(fc?.grille?.contentKind).toBe('flashcards');
    // La grille decouvre donc les memes decks que ceux resolus ci-dessus.
    expect(client.list(fc!.grille!.contentKind).length).toBe(decks.length);
  });
});

describe('ecran d entree flashcards : apercu d un deck', () => {
  it('Arts : 48 cartes, modele image (indice "Images")', async () => {
    const pack = await client.loadPack('arts', 'flashcards', 'Arts');
    const apercu = apercuDeck(pack);
    expect(apercu).toEqual({ nbCartes: 48, modele: 'image' });
    expect(libelleModele(apercu.modele)).toBe('Images');
    expect(iconeModele(apercu.modele)).toBe('🖼️');
  });

  it('Logique : 30 cartes, modele qr (indice "Question-reponse")', async () => {
    const pack = await client.loadPack('logique', 'flashcards', 'Logique');
    const apercu = apercuDeck(pack);
    expect(apercu).toEqual({ nbCartes: 30, modele: 'qr' });
    expect(libelleModele(apercu.modele)).toBe('Question-reponse');
  });

  it('un deck heterogene est signale "mixte"', () => {
    const mixte = parsePack('flashcards', {
      contentKind: 'flashcards',
      sujet: 'demo',
      titre: 'Demo',
      cartes: [
        { type: 'qr', id: 'a', question: 'Q', reponse: 'R' },
        { type: 'image', id: 'b', image: '/img/flashcards/x.webp', titre: 'T', date: '2000', description: 'D' },
      ],
    });
    expect(apercuDeck(mixte)).toEqual({ nbCartes: 2, modele: 'mixte' });
    expect(libelleModele('mixte')).toBe('Mixte');
  });
});
