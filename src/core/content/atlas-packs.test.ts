import { describe, it, expect } from 'vitest';
import { parsePack } from './load';

/*
  Charge TOUS les packs atlas de src/content/atlas/ et valide chacun avec le schema Zod.
  Verrouille la convention typographique (aucun tiret cadratin) et les invariants
  structurels de la carte : geometrie presente, couches coherentes, fiches bien formees.
*/

const modules = import.meta.glob('../../content/atlas/*.json', { eager: true });

const packs = Object.entries(modules).map(([chemin, mod]) => ({
  chemin,
  raw: (mod as { default: unknown }).default ?? mod,
}));

describe('packs atlas (tous)', () => {
  it('au moins le pack Monde est present', () => {
    expect(packs.length).toBeGreaterThanOrEqual(1);
  });

  it.each(packs)('valide le pack $chemin', ({ raw }) => {
    const pack = parsePack('atlas', raw);
    expect(pack.contentKind).toBe('atlas');
    expect(pack.sujet.length).toBeGreaterThan(0);
    expect(pack.titre.length).toBeGreaterThan(0);
    expect(pack.viewBox).toMatch(/^\d/);

    // Geometrie : chaque pays porte un trace SVG et une couleur de base.
    expect(pack.pays.length).toBeGreaterThan(0);
    for (const p of pack.pays) {
      expect(p.d.length).toBeGreaterThan(0);
      expect(p.baseColor).toMatch(/^#[0-9a-fA-F]{3,8}$/);
    }

    // Convention de redaction : aucun tiret cadratin ni demi-cadratin.
    const texte = JSON.stringify(pack);
    expect(texte).not.toContain('—');
    expect(texte).not.toContain('–');
    expect(texte).not.toContain('−');
  });
});

describe('pack Monde (pilote)', () => {
  const monde = packs.find((p) => p.chemin.includes('monde'));

  it('le pack pilote existe', () => {
    expect(monde).toBeDefined();
  });

  it('expose les couches de parite legacy (geo + economie)', () => {
    const pack = parsePack('atlas', monde!.raw);
    // Choropleth : demo / water / energy.
    expect(Object.keys(pack.couches.colors).sort()).toEqual(['demo', 'energy', 'water']);
    // Climat, ressources et maritime presents.
    expect(pack.couches.climat).toBeDefined();
    expect(pack.couches.ressources?.groupes['energy-res']).toBeDefined();
    expect(pack.couches.ressources?.groupes.minerais).toBeDefined();
    expect(pack.couches.maritime?.routes.length).toBeGreaterThan(0);
    expect(pack.couches.maritime?.detroits.length).toBeGreaterThan(0);

    // Navigation : les deux categories implementees, chaque couche a un type connu.
    const ids = pack.navConfig.map((c) => c.id);
    expect(ids).toEqual(['geo', 'economie']);
  });

  it('relie chaque fiche a un trace de carte connu', () => {
    const pack = parsePack('atlas', monde!.raw);
    const isos = new Set(pack.pays.map((p) => p.id));
    // Micro-Etats absents de la geometrie (trop petits pour un trace) : leur fiche
    // existe mais reste inatteignable au clic. Ils sont tolerees explicitement.
    const microEtats = new Set(['SG']);
    const orphelines = Object.keys(pack.fiches).filter((iso) => !isos.has(iso));
    expect(orphelines.every((iso) => microEtats.has(iso))).toBe(true);
  });
});
