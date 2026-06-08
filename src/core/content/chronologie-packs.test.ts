import { describe, it, expect } from 'vitest';
import { parsePack } from './load';

/*
  Charge TOUS les packs chronologie de src/content/chronologie/ et valide chacun avec
  le schema Zod. Deposer une nouvelle branche (passe ulterieure) la fait entrer
  automatiquement dans cette suite. Verrouille aussi la convention typographique et la
  strategie d'images (URL racine vers public/, jamais un chemin legacy).
*/

const modules = import.meta.glob('../../content/chronologie/*.json', { eager: true });

const packs = Object.entries(modules).map(([chemin, mod]) => ({
  chemin,
  raw: (mod as { default: unknown }).default ?? mod,
}));

describe('packs chronologie (tous)', () => {
  it('au moins la branche pilote Antiquite est presente', () => {
    expect(packs.length).toBeGreaterThanOrEqual(1);
  });

  it.each(packs)('valide le pack $chemin', ({ raw }) => {
    const pack = parsePack('chronologie', raw);
    expect(pack.contentKind).toBe('chronologie');
    expect(pack.sujet.length).toBeGreaterThan(0);
    expect(pack.titre.length).toBeGreaterThan(0);
    expect(pack.periodes.length).toBeGreaterThan(0);

    // Au moins une periode datee (sinon il n'y a que des entetes vides).
    const avecEvents = pack.periodes.filter((p) => p.events.length > 0);
    expect(avecEvents.length).toBeGreaterThan(0);

    for (const p of pack.periodes) {
      for (const e of p.events) {
        expect(e.title.length).toBeGreaterThan(0);
        expect(e.date.length).toBeGreaterThan(0);
        expect(e.desc.length).toBeGreaterThan(0);
        // Strategie images : URL racine servie depuis public/, jamais un chemin legacy.
        if (e.img !== undefined) {
          expect(e.img.startsWith('/img/chronologie/')).toBe(true);
        }
      }
    }

    // Convention de redaction : aucun tiret cadratin ni demi-cadratin.
    const texte = JSON.stringify(pack);
    expect(texte).not.toContain('—');
    expect(texte).not.toContain('–');
    expect(texte).not.toContain('−');
  });
});

describe('branche Antiquite (pilote)', () => {
  const antiquite = packs.find((p) => p.chemin.includes('antiquite'));

  it('le pack pilote existe', () => {
    expect(antiquite).toBeDefined();
  });

  it('totalise les 63 evenements migres repartis en 10 periodes', () => {
    const pack = parsePack('chronologie', antiquite!.raw);
    expect(pack.periodes.length).toBe(10);
    const total = pack.periodes.reduce((n, p) => n + p.events.length, 0);
    expect(total).toBe(63);
  });
});
