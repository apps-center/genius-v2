import { describe, it, expect } from 'vitest';
import {
  initDeck,
  retourner,
  suivante,
  precedente,
  estPremiere,
  estDerniere,
  numeroCarte,
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
