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
} from './deck';

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
});

describe('melanger (Mode Genius - melange pur)', () => {
  const src = [1, 2, 3, 4, 5, 6, 7, 8];

  it('est deterministe : meme seed, meme ordre', () => {
    expect(melanger(src, 42)).toEqual(melanger(src, 42));
  });

  it('conserve exactement les memes elements (permutation)', () => {
    const out = melanger(src, 7);
    expect(out).toHaveLength(src.length);
    expect([...out].sort((a, b) => a - b)).toEqual(src);
  });

  it('ne mute pas le tableau d entree', () => {
    const copie = [...src];
    melanger(src, 3);
    expect(src).toEqual(copie);
  });

  it('brasse reellement l ordre (au moins un seed le change)', () => {
    const seeds = [1, 2, 3, 99, 123];
    expect(seeds.some((g) => melanger(src, g).some((v, i) => v !== src[i]))).toBe(true);
  });
});
