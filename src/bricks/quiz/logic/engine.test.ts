import { describe, it, expect } from 'vitest';
import { init, repondre, fini, itemCourant, DEFAULT_TAILLE } from './engine';
import type { QcmItem } from '../../../core/content/qcm.schema';

const items: QcmItem[] = [
  { id: 'a', question: 'Q1', choix: ['x', 'y'], bonneReponse: 0 },
  { id: 'b', question: 'Q2', choix: ['x', 'y'], bonneReponse: 1 },
];

describe('quiz engine', () => {
  it('init pose le bon total', () => {
    expect(init(items, 1).total).toBe(2);
  });

  it('plafonne le total a la taille demandee', () => {
    const grand: QcmItem[] = Array.from({ length: 30 }, (_, i) => ({
      id: String(i),
      question: `Q${i}`,
      choix: ['x', 'y'],
      bonneReponse: 0,
    }));
    expect(init(grand, 1).total).toBe(DEFAULT_TAILLE);
  });

  it('compte les bonnes reponses et se termine', () => {
    let s = init(items, 1);
    s = repondre(s, items, items[itemCourant(s)]!.bonneReponse).state;
    s = repondre(s, items, items[itemCourant(s)]!.bonneReponse).state;
    expect(fini(s)).toBe(true);
    expect(s.score).toBe(2);
  });

  it('une mauvaise reponse n_incremente pas le score', () => {
    const s = init(items, 1);
    const mauvais = (items[itemCourant(s)]!.bonneReponse + 1) % 2;
    const { state, correct } = repondre(s, items, mauvais);
    expect(correct).toBe(false);
    expect(state.score).toBe(0);
  });

  it('le tirage est deterministe pour une meme graine', () => {
    expect(init(items, 42).ordre).toEqual(init(items, 42).ordre);
  });
});
