import { describe, it, expect } from 'vitest';
import { parsePack } from './load';
import { Flashcard } from './flashcards.schema';

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

  it('deck histoire (modele image) : 206 cartes, toutes de type image', () => {
    const histoire = packs.find((p) => p.chemin.includes('histoire'));
    expect(histoire).toBeDefined();
    const pack = parsePack('flashcards', histoire!.raw);
    expect(pack.cartes.length).toBe(206);
    expect(pack.cartes.every((c) => c.type === 'image')).toBe(true);
    // Strategie images : URL racine servie depuis public/, jamais un chemin legacy.
    expect(pack.cartes.every((c) => c.type === 'image' && c.image.startsWith('/img/flashcards/histoire/'))).toBe(true);
  });

  it('deck logique (modele question-reponse) : 30 cartes, toutes de type qr', () => {
    const logique = packs.find((p) => p.chemin.includes('logique'));
    expect(logique).toBeDefined();
    const pack = parsePack('flashcards', logique!.raw);
    expect(pack.cartes.length).toBe(30);
    expect(pack.cartes.every((c) => c.type === 'qr')).toBe(true);
  });

  it('deck geographie (modele question-reponse) : 155 cartes, toutes de type qr, sans illustration', () => {
    const geo = packs.find((p) => p.chemin.includes('geographie'));
    expect(geo).toBeDefined();
    const pack = parsePack('flashcards', geo!.raw);
    expect(pack.cartes.length).toBe(155);
    expect(pack.cartes.every((c) => c.type === 'qr')).toBe(true);
    // Migration TEXTE seul : aucune illustration remplie a ce stade.
    expect(pack.cartes.every((c) => c.type === 'qr' && c.illustration === undefined)).toBe(true);
  });

  it('deck mathematiques (modele question-reponse) : 248 cartes, toutes de type qr, sans illustration', () => {
    const maths = packs.find((p) => p.chemin.includes('mathematiques'));
    expect(maths).toBeDefined();
    const pack = parsePack('flashcards', maths!.raw);
    expect(pack.cartes.length).toBe(248);
    expect(pack.cartes.every((c) => c.type === 'qr')).toBe(true);
    // Migration TEXTE seul : les SVG inline du legacy ne sont pas migres.
    expect(pack.cartes.every((c) => c.type === 'qr' && c.illustration === undefined)).toBe(true);
  });

  it('deck sciences (modele question-reponse) : 155 cartes, toutes de type qr, sans illustration', () => {
    const sciences = packs.find((p) => p.chemin.includes('sciences'));
    expect(sciences).toBeDefined();
    const pack = parsePack('flashcards', sciences!.raw);
    expect(pack.cartes.length).toBe(155);
    expect(pack.cartes.every((c) => c.type === 'qr')).toBe(true);
    // Migration TEXTE seul : les references SVG.* du legacy ne sont pas migrees.
    expect(pack.cartes.every((c) => c.type === 'qr' && c.illustration === undefined)).toBe(true);
  });
});

describe('carte qr : illustration optionnelle (bitmap, svg, ou absente)', () => {
  const base = { type: 'qr' as const, id: 'q1', question: 'Q ?', reponse: 'R' };

  it('une carte qr SANS illustration est valide (comportement actuel inchange)', () => {
    const res = Flashcard.safeParse(base);
    expect(res.success).toBe(true);
    expect(res.success && res.data.type === 'qr' && res.data.illustration).toBeUndefined();
  });

  it('une carte qr AVEC illustration image (bitmap) valide le schema', () => {
    const res = Flashcard.safeParse({
      ...base,
      illustration: { type: 'image', src: '/img/flashcards/geographie/france.webp' },
    });
    expect(res.success).toBe(true);
    expect(res.success && res.data.type === 'qr' && res.data.illustration?.type).toBe('image');
  });

  it('une carte qr AVEC illustration svg inline valide le schema', () => {
    const res = Flashcard.safeParse({
      ...base,
      illustration: { type: 'svg', svg: '<svg viewBox="0 0 10 10"></svg>' },
    });
    expect(res.success).toBe(true);
    expect(res.success && res.data.type === 'qr' && res.data.illustration?.type).toBe('svg');
  });

  it('une illustration de type inconnu OU mal formee est rejetee', () => {
    expect(Flashcard.safeParse({ ...base, illustration: { type: 'video', src: 'x' } }).success).toBe(false);
    // type 'image' sans `src` : rejete.
    expect(Flashcard.safeParse({ ...base, illustration: { type: 'image' } }).success).toBe(false);
    // type 'svg' sans `svg` : rejete.
    expect(Flashcard.safeParse({ ...base, illustration: { type: 'svg' } }).success).toBe(false);
  });
});
