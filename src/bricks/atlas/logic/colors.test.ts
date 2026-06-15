import { describe, it, expect } from 'vitest';
import { fillPays, ressourcesFiltrees } from './colors';
import type { CouchesAtlas, PaysAtlas } from '../../../core/content/atlas.schema';

const pays: PaysAtlas = {
  id: 'FR',
  iso3: 'FRA',
  name: 'France',
  cont: 'Europe',
  d: 'M0,0 Z',
  baseColor: '#111111',
};

const couches: CouchesAtlas = {
  colors: {
    water: {
      label: 'Stress hydrique',
      pays: { FR: '#aaaaaa' },
      continentDefaut: { Europe: '#bbbbbb' },
      legende: [],
    },
    demo: {
      label: 'Demographie',
      pays: {},
      continentDefaut: { Asia: '#cccccc' },
      legende: [],
    },
  },
  climat: {
    label: 'Climat',
    data: { FR: 'oceanic' },
    zones: { oceanic: { color: '#0000ff', label: 'Oceanique' } },
  },
  ressources: {
    meta: {
      oil: { icon: '🛢', color: '#000', label: 'Petrole' },
      gold: { icon: '🥇', color: '#fc0', label: 'Or' },
    },
    data: { FR: ['oil', 'gold', 'wood'] },
    groupes: {
      'energy-res': { label: 'Energie', types: ['oil', 'gas'] },
      minerais: { label: 'Minerais', types: ['gold', 'wood'] },
    },
  },
  maritime: { label: 'Maritime', routes: [], detroits: [], niveauCouleurs: {} },
};

describe('fillPays - cascade de couleur', () => {
  it('couche base : couleur de base', () => {
    expect(fillPays(pays, 'world', 'base', couches)).toBe('#111111');
  });
  it('couche colors : couleur du pays prioritaire', () => {
    expect(fillPays(pays, 'water', 'colors', couches)).toBe('#aaaaaa');
  });
  it('couche colors : repli continental si pays absent', () => {
    // FR absent de demo.pays mais Europe absent de demo.continentDefaut -> base.
    expect(fillPays(pays, 'demo', 'colors', couches)).toBe('#111111');
    // Un pays asiatique tomberait sur le repli continental.
    const asie = { ...pays, id: 'JP', cont: 'Asia' };
    expect(fillPays(asie, 'demo', 'colors', couches)).toBe('#cccccc');
  });
  it('couche colors inconnue : base', () => {
    expect(fillPays(pays, 'inexistante', 'colors', couches)).toBe('#111111');
  });
  it('couche climat : couleur de la zone', () => {
    expect(fillPays(pays, 'climat', 'climat', couches)).toBe('#0000ff');
  });
  it('couche climat sans donnee pour le pays : base', () => {
    const sansClimat = { ...pays, id: 'XX' };
    expect(fillPays(sansClimat, 'climat', 'climat', couches)).toBe('#111111');
  });
  it('couches ressources / maritime : base (surimpression ailleurs)', () => {
    expect(fillPays(pays, 'minerais', 'ressources', couches)).toBe('#111111');
    expect(fillPays(pays, 'maritime', 'maritime', couches)).toBe('#111111');
  });
});

describe('ressourcesFiltrees', () => {
  it('ne garde que les ressources du groupe, dans l ordre du pays', () => {
    expect(ressourcesFiltrees('FR', 'energy-res', couches)).toEqual(['oil']);
    expect(ressourcesFiltrees('FR', 'minerais', couches)).toEqual(['gold', 'wood']);
  });
  it('pays sans ressources : tableau vide', () => {
    expect(ressourcesFiltrees('XX', 'minerais', couches)).toEqual([]);
  });
});
