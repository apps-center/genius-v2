import { describe, it, expect } from 'vitest';
import {
  construireFrise,
  compterEvenements,
  compterPeriodes,
  type SectionFrise,
} from './frise';
import type { ChronoPeriode } from '../../../core/content/chronologie.schema';

/*
  Mecanique de la frise testee sans navigateur (logic/ pur). On valide la separation
  entetes / sous-periodes, la numerotation continue et l'alternance gauche/droite.
*/

const periodes: ChronoPeriode[] = [
  { era: '⬛ ENTETE A', events: [] },
  {
    era: '✦ Sous-periode 1',
    events: [
      { title: 'E1', date: '-3000', desc: 'd1', anecdotes: [] },
      { title: 'E2', date: '-2900', desc: 'd2', anecdotes: [] },
    ],
  },
  { era: '⬛ ENTETE B', events: [] },
  {
    era: '✦ Sous-periode 2',
    events: [{ title: 'E3', date: '-2800', desc: 'd3', anecdotes: [] }],
  },
];

describe('construireFrise', () => {
  const sections = construireFrise(periodes);

  it('conserve l ordre et le nombre de sections', () => {
    expect(sections.map((s) => s.type)).toEqual(['entete', 'periode', 'entete', 'periode']);
  });

  it('traite une periode sans evenement comme un entete', () => {
    const entete = sections[0] as Extract<SectionFrise, { type: 'entete' }>;
    expect(entete.type).toBe('entete');
    expect(entete.era).toBe('⬛ ENTETE A');
  });

  it('numerote les evenements de facon continue d une periode a l autre', () => {
    const p1 = sections[1] as Extract<SectionFrise, { type: 'periode' }>;
    const p2 = sections[3] as Extract<SectionFrise, { type: 'periode' }>;
    expect(p1.evenements.map((e) => e.numero)).toEqual([1, 2]);
    expect(p2.evenements.map((e) => e.numero)).toEqual([3]);
  });

  it('alterne les colonnes gauche / droite selon la parite du numero', () => {
    const p1 = sections[1] as Extract<SectionFrise, { type: 'periode' }>;
    const p2 = sections[3] as Extract<SectionFrise, { type: 'periode' }>;
    expect(p1.evenements.map((e) => e.cote)).toEqual(['gauche', 'droite']);
    expect(p2.evenements[0]?.cote).toBe('gauche');
  });

  it('donne une cle stable et unique a chaque evenement', () => {
    const cles = sections
      .filter((s): s is Extract<SectionFrise, { type: 'periode' }> => s.type === 'periode')
      .flatMap((s) => s.evenements.map((e) => e.cle));
    expect(new Set(cles).size).toBe(cles.length);
  });
});

describe('compteurs', () => {
  it('compte les evenements dates (entetes exclus)', () => {
    expect(compterEvenements(periodes)).toBe(3);
  });
  it('compte les sous-periodes datees (entetes exclus)', () => {
    expect(compterPeriodes(periodes)).toBe(2);
  });
});
