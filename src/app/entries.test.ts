import { describe, it, expect } from 'vitest';
import {
  ENTRIES,
  entreesParSection,
  entreeParId,
  modeParId,
  libelleSection,
} from './entries';

/*
  Registre de navigation (niveaux 1 et 2). Teste sans navigateur : entries.ts est
  de la donnee pure (aucun import de brique, aucun React). Verrouille l'ordre, les
  etats et le couplage du seul mode jouable, conformement a docs/audit-legacy.md.
*/

describe('registre de navigation (entries)', () => {
  it('expose 8 entrees d accueil', () => {
    expect(ENTRIES.length).toBe(8);
  });

  it('section Entrainement : Flashcards puis Quiz, dans l ordre de l audit', () => {
    expect(entreesParSection('entrainement').map((e) => e.titre)).toEqual(['Flashcards', 'Quiz']);
  });

  it('section Modules : les 6 modules dans l ordre exact de l audit', () => {
    expect(entreesParSection('modules').map((e) => e.titre)).toEqual([
      'Chronologie Historique',
      'Atlas Geopolitique',
      'Arts & Culture',
      'Logique & Raisonnement',
      'Mathematiques',
      'Sciences & Nature',
    ]);
  });

  it('entrees disponibles : Flashcards, Quiz, Chronologie et Atlas ; le reste a venir', () => {
    const dispo = ENTRIES.filter((e) => e.etat === 'disponible')
      .map((e) => e.id)
      .sort();
    expect(dispo).toEqual(['atlas', 'chronologie', 'flashcards', 'quiz']);
  });

  it('la Flashcards ouvre une grille de decks branchee sur la brique flashcards', () => {
    const fc = entreeParId('flashcards');
    expect(fc?.etat).toBe('disponible');
    // Niveau 2 = grille decouverte du registre (pas de modes, pas de lancement direct).
    expect(fc?.modes).toBeUndefined();
    expect(fc?.lancement).toBeUndefined();
    expect(fc?.grille).toEqual({ brickId: 'flashcards', contentKind: 'flashcards' });
  });

  it('la Chronologie lance directement la brique chronologie sur la branche Antiquite', () => {
    const chrono = entreeParId('chronologie');
    expect(chrono?.etat).toBe('disponible');
    expect(chrono?.lancement).toEqual({
      brickId: 'chronologie',
      contentKind: 'chronologie',
      sujet: 'histoire',
      titre: 'Antiquité',
    });
  });

  it('l Atlas lance directement la brique atlas sur le pack Monde', () => {
    const atlas = entreeParId('atlas');
    expect(atlas?.etat).toBe('disponible');
    expect(atlas?.lancement).toEqual({
      brickId: 'atlas',
      contentKind: 'atlas',
      sujet: 'geographie',
      titre: 'Monde',
    });
  });

  it('le Quiz propose 3 modes, seul Quiz Questions est jouable', () => {
    const quiz = entreeParId('quiz');
    expect(quiz?.modes?.map((m) => m.titre)).toEqual([
      'Quiz Questions',
      'Quiz Dates',
      'Quiz Images',
    ]);
    const dispo = (quiz?.modes ?? []).filter((m) => m.etat === 'disponible');
    expect(dispo.map((m) => m.id)).toEqual(['questions']);
  });

  it('le mode jouable branche la brique quiz sur le contentKind qcm', () => {
    const quiz = entreeParId('quiz');
    const questions = quiz ? modeParId(quiz, 'questions') : undefined;
    expect(questions?.brickId).toBe('quiz');
    expect(questions?.contentKind).toBe('qcm');
  });

  it('les modes a venir ne branchent ni brique ni contenu (zero fausse donnee)', () => {
    const quiz = entreeParId('quiz');
    for (const m of quiz?.modes ?? []) {
      if (m.etat === 'a-venir') {
        expect(m.brickId).toBeUndefined();
        expect(m.contentKind).toBeUndefined();
      }
    }
  });

  it('libelles de section conformes a l audit', () => {
    expect(libelleSection('entrainement')).toBe('Entrainement');
    expect(libelleSection('modules')).toBe('Modules interactifs');
  });

  it('convention de redaction : aucun tiret cadratin ni demi-cadratin', () => {
    const texte = JSON.stringify(ENTRIES);
    expect(texte).not.toContain('—');
    expect(texte).not.toContain('–');
  });
});
