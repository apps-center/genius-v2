import { describe, it, expect } from 'vitest';
import { CONTENT } from '../../app/registry';
import { createContentClient } from './client';

/*
  Resolution BOUT-EN-BOUT par le REGISTRE : pour chaque deck flashcards declare, on
  charge effectivement le pack via le ContentClient avec les coordonnees (sujet, titre)
  que la nav et l'URL utilisent (?sujet=...&titre=...). On ne teste PAS seulement la
  presence d'une ligne : on verifie que loadPack la resout vraiment.

  Ce test aurait attrape le bug du deck arts : son `titre` de registre ('Arts et Culture')
  divergeait du titre attendu pour l'atteindre ('Arts'), donc loadPack ne trouvait aucune
  entree. La regle verrouillee ici : le `titre` de registre (cle d'appariement / URL) DOIT
  egaler le `titre` du pack charge (affiche). Toute divergence reintroduit la panne.
*/

const client = createContentClient(CONTENT);
const decks = client.list('flashcards');

describe('resolution des decks flashcards via le registre', () => {
  it('au moins les deux decks pilotes sont declares', () => {
    expect(decks.length).toBeGreaterThanOrEqual(2);
  });

  it.each(decks)('resout le deck $sujet / $titre', async ({ sujet, titre }) => {
    // Exactement le chemin emprunte par la brique : loadPack(sujet, 'flashcards', titre).
    const pack = await client.loadPack(sujet, 'flashcards', titre);
    expect(pack.contentKind).toBe('flashcards');
    expect(pack.sujet).toBe(sujet);
    // Le titre de registre (cle URL/nav) et le titre du pack charge doivent coincider :
    // sinon le deck est injoignable par la coordonnee qui sert a l'atteindre.
    expect(pack.titre).toBe(titre);
    expect(pack.cartes.length).toBeGreaterThan(0);
  });

  it('le deck arts est joignable par ?sujet=arts&titre=Arts et sert au moins une image', async () => {
    const pack = await client.loadPack('arts', 'flashcards', 'Arts');
    expect(pack.cartes.length).toBeGreaterThan(0);
    const premiereImage = pack.cartes.find((c) => c.type === 'image');
    expect(premiereImage).toBeDefined();
    if (premiereImage && premiereImage.type === 'image') {
      expect(premiereImage.image.startsWith('/img/flashcards/')).toBe(true);
    }
  });
});
