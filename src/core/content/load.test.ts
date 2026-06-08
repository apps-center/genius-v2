import { describe, it, expect } from 'vitest';
import { parsePack, parseQcmPack, ContentError } from './load';
import antiquite from '../../content/histoire/antiquite-qcm.json';
import prehistoire from '../../content/histoire/prehistoire-qcm.json';

describe('chargement de contenu', () => {
  it('accepte un pack histoire valide', () => {
    const pack = parseQcmPack(antiquite);
    expect(pack.contentKind).toBe('qcm');
    expect(pack.items.length).toBeGreaterThan(0);
  });

  it('accepte le pack Prehistoire migre depuis le legacy', () => {
    const pack = parseQcmPack(prehistoire);
    expect(pack.titre).toBe('Préhistoire');
    expect(pack.items).toHaveLength(30);
    // Tous les items portent leur theme d'origine (ancien champ `era`).
    expect(pack.items.every((i) => i.sujet === 'Préhistoire')).toBe(true);
    // Chaque index de bonne reponse pointe dans les choix (verifie par le schema).
    expect(pack.items.every((i) => i.bonneReponse < i.choix.length)).toBe(true);
    // Identifiants stables et uniques.
    expect(new Set(pack.items.map((i) => i.id)).size).toBe(pack.items.length);
  });

  it('respecte la convention typographique : aucun tiret cadratin dans le pack', () => {
    // Le contenu legacy en contenait : la migration doit les avoir convertis.
    const texte = JSON.stringify(prehistoire);
    expect(texte).not.toContain('—'); // tiret cadratin (em dash)
    expect(texte).not.toContain('–'); // tiret demi-cadratin (en dash)
  });

  it('rejette un pack malforme avec un message clair (jamais d_ecran blanc)', () => {
    const malforme = {
      contentKind: 'qcm',
      sujet: 'histoire',
      titre: 'Casse',
      items: [{ id: 'x', question: '', choix: ['a'], bonneReponse: 5 }],
    };
    expect(() => parsePack('qcm', malforme)).toThrow(ContentError);
    try {
      parsePack('qcm', malforme);
    } catch (e) {
      const msg = (e as Error).message;
      // Le message designe explicitement les champs fautifs.
      expect(msg).toContain('Pack "qcm" invalide');
      expect(msg).toMatch(/question|choix|bonneReponse/);
    }
  });

  it('rejette un index de bonne reponse hors des choix', () => {
    const pack = {
      contentKind: 'qcm',
      sujet: 's',
      titre: 't',
      items: [{ id: 'y', question: 'Q', choix: ['a', 'b'], bonneReponse: 2 }],
    };
    expect(() => parseQcmPack(pack)).toThrow(/bonneReponse/);
  });
});
