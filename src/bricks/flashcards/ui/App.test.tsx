// @vitest-environment jsdom
/*
  Test de COMPORTEMENT (ui/) : la transition de flip n'est ACTIVE que pour un retournement
  volontaire, jamais lors d'une navigation. C'est ce qui garantit l'absence de retournement
  parasite (et de flash de la face arriere) quand on change de carte.

  Mecanique : le composant pose la classe .anime sur l'enveloppe de flip uniquement quand on
  retourne volontairement la carte. En navigation (Suivante/Precedente), la classe est
  absente : le retour au recto est donc instantane (le CSS ne transitionne que sous .anime).
*/
import { describe, it, expect, afterEach, vi } from 'vitest';
import { act } from 'react';
import { render, cleanup, fireEvent } from '@testing-library/react';
import { Deck } from './App';
import styles from './Flashcards.module.css';
import type { AppContext } from '../../../core/context';
import type { FlashcardsPack } from '../../../core/content/flashcards.schema';

// Active le mode "act" de React 18 hors RTL auto-config (environnement jsdom manuel).
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const pack: FlashcardsPack = {
  contentKind: 'flashcards',
  sujet: 'logique',
  titre: 'Deck de test',
  cartes: [
    { type: 'qr', id: 'c1', question: 'Q1 ?', reponse: 'R1' },
    { type: 'qr', id: 'c2', question: 'Q2 ?', reponse: 'R2' },
  ],
};

function ctxStub(): AppContext {
  // Deck ne consomme que ctx.events.emit et ctx.settings.reducedMotion.
  return {
    events: { emit: vi.fn() },
    settings: { reducedMotion: false },
  } as unknown as AppContext;
}

afterEach(() => cleanup());

// Enveloppe de flip (role=button portant l'aria-label de la carte).
function flipWrap(container: HTMLElement): HTMLElement {
  const el = container.querySelector<HTMLElement>('[aria-label][role="button"]');
  if (!el) throw new Error('Enveloppe de flip introuvable');
  return el;
}

function flipInner(container: HTMLElement): HTMLElement {
  const el = flipWrap(container).firstElementChild as HTMLElement | null;
  if (!el) throw new Error('flipInner introuvable');
  return el;
}

function boutonParTexte(container: HTMLElement, texte: string): HTMLButtonElement {
  const btn = Array.from(container.querySelectorAll('button')).find(
    (b) => b.textContent?.trim() === texte,
  );
  if (!btn) throw new Error(`Bouton "${texte}" introuvable`);
  return btn;
}

describe('Flashcards - flip anime seulement volontairement (pas de parasite)', () => {
  it('au depart, la carte est sur le recto et n anime pas', () => {
    const { container } = render(<Deck ctx={ctxStub()} pack={pack} />);
    expect(flipInner(container).getAttribute('data-revelee')).toBeNull();
    expect(flipInner(container).className).not.toContain(styles.anime);
  });

  it('le retournement volontaire (clic sur la carte) active l animation', () => {
    const { container } = render(<Deck ctx={ctxStub()} pack={pack} />);
    act(() => {
      fireEvent.click(flipWrap(container));
    });
    expect(flipInner(container).getAttribute('data-revelee')).toBe('true');
    expect(flipInner(container).className).toContain(styles.anime);
  });

  it('la navigation depuis le verso revient au recto SANS animation (pas de parasite)', () => {
    const { container } = render(<Deck ctx={ctxStub()} pack={pack} />);

    // On revele la carte : verso visible, animation active.
    act(() => {
      fireEvent.click(flipWrap(container));
    });
    expect(flipInner(container).className).toContain(styles.anime);

    // Navigation depuis le verso : remise au recto, et l animation est coupee
    // (classe .anime retiree DU MEME element qui tourne) => aucun retournement visible.
    act(() => {
      fireEvent.click(boutonParTexte(container, 'Suivante'));
    });
    expect(flipInner(container).getAttribute('data-revelee')).toBeNull();
    expect(flipInner(container).className).not.toContain(styles.anime);
  });
});
