import { describe, it, expect } from 'vitest';
import {
  init,
  repondre,
  fini,
  itemCourant,
  melangeChoix,
  graineChoix,
  DEFAULT_TAILLE,
} from './engine';
import type { QcmItem } from '../../../core/content/qcm.schema';
import { parseQcmPack } from '../../../core/content/load';
import prehistoire from '../../../content/histoire/prehistoire-qcm.json';

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

describe('melange des choix a l_affichage', () => {
  it('conserve tous les choix sans doublon ni perte', () => {
    const { ordre } = melangeChoix(4, 0, 123);
    expect([...ordre].sort()).toEqual([0, 1, 2, 3]);
  });

  it('pointe vers la bonne reponse APRES permutation', () => {
    for (let seed = 1; seed <= 50; seed++) {
      const bonneOrigine = seed % 4;
      const { ordre, bonneReponse } = melangeChoix(4, bonneOrigine, seed);
      // La position affichee de la bonne reponse retrouve bien l'index d'origine.
      expect(ordre[bonneReponse]).toBe(bonneOrigine);
    }
  });

  it('est deterministe pour une meme graine', () => {
    expect(melangeChoix(4, 0, 7)).toEqual(melangeChoix(4, 0, 7));
  });

  it('partie complete sur le pack Prehistoire : choisir la bonne case donne 10/10', () => {
    // Simule le parcours UI : pour chaque question on clique la case AFFICHEE
    // qui correspond a la bonne reponse, via le meme melange que la brique.
    const pack = parseQcmPack(prehistoire);
    let s = init(pack.items, 2024);
    while (!fini(s)) {
      const item = pack.items[itemCourant(s)]!;
      const { ordre } = melangeChoix(item.choix.length, item.bonneReponse, graineChoix(s));
      const positionBonne = ordre.indexOf(item.bonneReponse);
      const indexOrigine = ordre[positionBonne]!; // = item.bonneReponse
      const { correct } = repondre(s, pack.items, indexOrigine);
      expect(correct).toBe(true);
      s = repondre(s, pack.items, indexOrigine).state;
    }
    expect(s.score).toBe(s.total);
    expect(s.total).toBe(DEFAULT_TAILLE);
  });

  it('ne fige pas la bonne reponse en position 0 (anti-biais legacy)', () => {
    // Le contenu legacy met toujours la bonne reponse en index 0. Au fil des questions
    // d'une partie, graineChoix doit faire varier sa position affichee.
    const grand: QcmItem[] = Array.from({ length: 12 }, (_, i) => ({
      id: String(i),
      question: 'Q',
      choix: ['a', 'b', 'c', 'd'],
      bonneReponse: 0,
    }));
    let s = init(grand, 1);
    const positions = new Set<number>();
    while (!fini(s)) {
      positions.add(melangeChoix(4, 0, graineChoix(s)).bonneReponse);
      s = repondre(s, grand, -1).state;
    }
    expect(positions.size).toBeGreaterThan(1);
  });
});
