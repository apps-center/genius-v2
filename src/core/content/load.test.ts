import { describe, it, expect } from 'vitest';
import { parsePack, parseQcmPack, ContentError } from './load';
import antiquite from '../../content/histoire/antiquite-qcm.json';

describe('chargement de contenu', () => {
  it('accepte un pack histoire valide', () => {
    const pack = parseQcmPack(antiquite);
    expect(pack.contentKind).toBe('qcm');
    expect(pack.items.length).toBeGreaterThan(0);
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
