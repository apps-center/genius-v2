import { describe, it, expect } from 'vitest';
import { parsePack } from './load';

/*
  Charge TOUS les decks flashcards de src/content/flashcards/ et valide chacun avec le
  schema Zod. Deposer un nouveau deck le fait entrer automatiquement dans cette suite.
  Verrouille la convention typographique (aucun tiret long) et la strategie d'images
  (URL racine vers public/, jamais un chemin legacy).
*/

const modules = import.meta.glob('../../content/flashcards/*.json', { eager: true });

const packs = Object.entries(modules).map(([chemin, mod]) => ({
  chemin,
  raw: (mod as { default: unknown }).default ?? mod,
}));

describe('packs flashcards (tous)', () => {
  it('les deux decks pilotes sont presents', () => {
    expect(packs.length).toBeGreaterThanOrEqual(2);
  });

  it.each(packs)('valide le deck $chemin', ({ raw }) => {
    const pack = parsePack('flashcards', raw);
    expect(pack.contentKind).toBe('flashcards');
    expect(pack.sujet.length).toBeGreaterThan(0);
    expect(pack.titre.length).toBeGreaterThan(0);
    expect(pack.cartes.length).toBeGreaterThan(0);

    const ids = new Set<string>();
    for (const c of pack.cartes) {
      // Identifiants uniques au sein d'un deck.
      expect(ids.has(c.id)).toBe(false);
      ids.add(c.id);

      if (c.type === 'image') {
        expect(c.titre.length).toBeGreaterThan(0);
        expect(c.date.length).toBeGreaterThan(0);
        expect(c.description.length).toBeGreaterThan(0);
        // Strategie images : URL racine servie depuis public/, jamais un chemin legacy.
        expect(c.image.startsWith('/img/flashcards/')).toBe(true);
      } else {
        expect(c.question.length).toBeGreaterThan(0);
        expect(c.reponse.length).toBeGreaterThan(0);
        if (c.difficulte !== undefined) {
          expect(c.difficulte).toBeGreaterThanOrEqual(1);
          expect(c.difficulte).toBeLessThanOrEqual(3);
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

describe('couverture des deux modeles de carte', () => {
  it('un deck pilote utilise le modele image, un autre le modele question-reponse', () => {
    const types = new Set<string>();
    for (const { raw } of packs) {
      const pack = parsePack('flashcards', raw);
      for (const c of pack.cartes) types.add(c.type);
    }
    expect(types.has('image')).toBe(true);
    expect(types.has('qr')).toBe(true);
  });

  it('deck arts (modele image) : 48 cartes, toutes de type image', () => {
    const arts = packs.find((p) => p.chemin.includes('arts'));
    expect(arts).toBeDefined();
    const pack = parsePack('flashcards', arts!.raw);
    expect(pack.cartes.length).toBe(48);
    expect(pack.cartes.every((c) => c.type === 'image')).toBe(true);
  });

  it('deck logique (modele question-reponse) : 30 cartes, toutes de type qr', () => {
    const logique = packs.find((p) => p.chemin.includes('logique'));
    expect(logique).toBeDefined();
    const pack = parsePack('flashcards', logique!.raw);
    expect(pack.cartes.length).toBe(30);
    expect(pack.cartes.every((c) => c.type === 'qr')).toBe(true);
  });
});
