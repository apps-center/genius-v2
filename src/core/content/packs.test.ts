import { describe, it, expect } from 'vitest';
import { parseQcmPack } from './load';

/*
  Test parametre : charge TOUS les packs QCM du dossier content/histoire/ et valide
  chacun avec le schema Zod. Deposer un nouveau pack le fait entrer automatiquement
  dans cette suite (aucune liste a maintenir). Verrouille aussi la convention
  typographique (aucun tiret cadratin) sur l'ensemble du contenu migre.
*/

// import.meta.glob (Vite/Vitest) : recupere tous les .json du dossier, charges eagerement.
const modules = import.meta.glob('../../content/histoire/*-qcm.json', { eager: true });

const packs = Object.entries(modules).map(([chemin, mod]) => ({
  chemin,
  raw: (mod as { default: unknown }).default ?? mod,
}));

describe('packs QCM histoire (tous)', () => {
  it('le dossier contient bien les packs migres', () => {
    // 24 themes au total (Prehistoire + 23 autres). Garde-fou anti-regression.
    expect(packs.length).toBeGreaterThanOrEqual(24);
  });

  it.each(packs)('valide le pack $chemin', ({ raw }) => {
    const pack = parseQcmPack(raw);
    expect(pack.contentKind).toBe('qcm');
    expect(pack.sujet).toBe('histoire');
    expect(pack.titre.length).toBeGreaterThan(0);
    expect(pack.items.length).toBeGreaterThan(0);

    // Identifiants stables et uniques dans le pack.
    const ids = pack.items.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);

    // Coherence deja garantie par le schema, on l'affirme explicitement.
    for (const it of pack.items) {
      expect(it.bonneReponse).toBeLessThan(it.choix.length);
    }

    // Convention de redaction : aucun tiret cadratin ni demi-cadratin.
    const texte = JSON.stringify(pack);
    expect(texte).not.toContain('—');
    expect(texte).not.toContain('–');
  });

  it('totalise toutes les questions QCM migrees', () => {
    const total = packs.reduce((n, p) => n + parseQcmPack(p.raw).items.length, 0);
    // Prehistoire (30) + 150 autres = 180 questions du tableau QCM legacy.
    expect(total).toBe(180);
  });
});
