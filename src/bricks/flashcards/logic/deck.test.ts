import { describe, it, expect } from 'vitest';
import {
  initDeck,
  retourner,
  suivante,
  precedente,
  estPremiere,
  estDerniere,
  numeroCarte,
  melanger,
  ordreNormal,
  indexCourant,
} from './deck';

// RNG deterministe (LCG) : melange reproductible pour les tests, jamais Math.random.
function rngSeed(seed: number): () => number {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

describe('deck flashcards (logique pure)', () => {
  it('init pose la premiere carte, recto visible', () => {
    const s = initDeck(3);
    expect(s.position).toBe(0);
    expect(s.total).toBe(3);
    expect(s.revelee).toBe(false);
    expect(numeroCarte(s)).toBe(1);
    expect(estPremiere(s)).toBe(true);
    expect(estDerniere(s)).toBe(false);
  });

  it('refuse un deck vide', () => {
    expect(() => initDeck(0)).toThrow();
  });

  it('retourne la carte sans bouger la position', () => {
    let s = initDeck(2);
    s = retourner(s);
    expect(s.revelee).toBe(true);
    expect(s.position).toBe(0);
    s = retourner(s);
    expect(s.revelee).toBe(false);
  });

  it('suivante avance et repose sur le recto', () => {
    let s = initDeck(2);
    s = retourner(s); // verso visible
    s = suivante(s);
    expect(s.position).toBe(1);
    expect(s.revelee).toBe(false);
    expect(estDerniere(s)).toBe(true);
  });

  it('suivante est bornee a la derniere carte', () => {
    let s = initDeck(2);
    s = suivante(s);
    s = suivante(s);
    s = suivante(s);
    expect(s.position).toBe(1);
  });

  it('precedente recule, bornee a la premiere, et repose sur le recto', () => {
    let s = initDeck(3);
    s = suivante(s);
    s = retourner(s);
    s = precedente(s);
    expect(s.position).toBe(0);
    expect(s.revelee).toBe(false);
    s = precedente(s);
    expect(s.position).toBe(0);
  });

  it('init pose l ordre original du pack (identite, mode non melange)', () => {
    const s = initDeck(4);
    expect(s.ordre).toEqual([0, 1, 2, 3]);
    expect(s.melange).toBe(false);
    expect(indexCourant(s)).toBe(0);
  });
});

describe('deck flashcards - melange (Fisher-Yates)', () => {
  it('le melange est une permutation de TOUTES les cartes : ni perte ni doublon', () => {
    const s = melanger(initDeck(50), rngSeed(123));
    // Meme multiensemble d'index que l'ordre original (donc toutes les cartes, une seule fois).
    expect([...s.ordre].sort((a, b) => a - b)).toEqual(
      Array.from({ length: 50 }, (_, i) => i),
    );
    expect(new Set(s.ordre).size).toBe(50);
  });

  it('melanger revient a la carte 1 sur le recto et marque le mode melange', () => {
    let s = initDeck(5);
    s = suivante(s);
    s = retourner(s); // verso, position 1
    s = melanger(s, rngSeed(7));
    expect(s.position).toBe(0);
    expect(numeroCarte(s)).toBe(1);
    expect(s.revelee).toBe(false);
    expect(s.melange).toBe(true);
    expect(estPremiere(s)).toBe(true);
  });

  it('re-melanger en mode melange tire un NOUVEL ordre', () => {
    const a = melanger(initDeck(30), rngSeed(1));
    const b = melanger(a, rngSeed(2));
    expect(b.ordre).not.toEqual(a.ordre);
    // Toujours une permutation complete malgre le re-tirage.
    expect([...b.ordre].sort((x, y) => x - y)).toEqual(
      Array.from({ length: 30 }, (_, i) => i),
    );
  });

  it('ordreNormal restaure l ordre original du pack', () => {
    let s = melanger(initDeck(6), rngSeed(99));
    s = suivante(s);
    s = ordreNormal(s);
    expect(s.ordre).toEqual([0, 1, 2, 3, 4, 5]);
    expect(s.melange).toBe(false);
    expect(s.position).toBe(0);
    expect(s.revelee).toBe(false);
  });

  it('indexCourant suit l ordre d affichage melange', () => {
    const s = melanger(initDeck(4), rngSeed(42));
    expect(indexCourant(s)).toBe(s.ordre[0]);
    const s2 = suivante(s);
    expect(indexCourant(s2)).toBe(s.ordre[1]);
  });

  it('le melange ne mute NI l etat NI le pack source', () => {
    const cartes = ['A', 'B', 'C', 'D'];
    const cartesAvant = [...cartes];
    const s = initDeck(cartes.length);
    const ordreAvant = [...s.ordre];
    const melange = melanger(s, rngSeed(5));
    // L'etat d'origine est intact (immutabilite) ...
    expect(s.ordre).toEqual(ordreAvant);
    expect(s.melange).toBe(false);
    // ... et lire les cartes via l'ordre melange ne touche pas le tableau de cartes.
    melange.ordre.map((i) => cartes[i]);
    expect(cartes).toEqual(cartesAvant);
  });
});
