// @vitest-environment jsdom
/*
  Test de COMPORTEMENT (ui/) : verrouille l'absence de flip parasite a la navigation.

  Le bug : depuis le VERSO, cliquer "Suivante"/"Precedente" animait le retour au recto
  (~0.6s) avant d'afficher la carte suivante. Le correctif coupe la transition (.instant)
  pendant le changement et ne la retablit qu'apres une peinture confirmee, via un DOUBLE
  requestAnimationFrame.

  Pourquoi ce test distingue "avant" et "apres" : on pilote rAF a la main (file manuelle).
  - Ancien code (un seul rAF) : .instant est retire des la 1re frame -> au moment ou la
    transition serait reactivee, transform vaut encore 180->0, donc le navigateur animerait.
    L'assertion "instant encore present apres 1 frame" ECHOUE.
  - Nouveau code (double rAF) : .instant survit a la 1re frame (peinture du recto sans
    transition) et n'est retire qu'a la 2e. L'assertion PASSE.
*/
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
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

// File de rAF pilotee a la main : aucun callback ne s'execute tant qu'on ne "peint" pas.
let rafQueue: Array<() => void> = [];

function flushOneFrame() {
  const aJouer = rafQueue;
  rafQueue = [];
  act(() => {
    aJouer.forEach((cb) => cb());
  });
}

beforeEach(() => {
  rafQueue = [];
  vi.stubGlobal('requestAnimationFrame', (cb: () => void) => {
    rafQueue.push(cb);
    return rafQueue.length;
  });
  vi.stubGlobal('cancelAnimationFrame', () => {});
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

// Recupere l'enveloppe de flip (role=button portant l'aria-label de la carte).
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

describe('Flashcards - pas de flip parasite a la navigation', () => {
  it('depuis le verso, "Suivante" coupe la transition jusqu\'a une peinture confirmee', () => {
    const { container } = render(<Deck ctx={ctxStub()} pack={pack} />);

    // 1) On revele la carte : le verso est visible (data-revelee pose), flip volontaire anime.
    act(() => {
      fireEvent.click(flipWrap(container));
    });
    expect(flipInner(container).getAttribute('data-revelee')).toBe('true');
    expect(flipWrap(container).className).not.toContain(styles.instant);

    // 2) Navigation depuis le verso : remise au recto.
    act(() => {
      fireEvent.click(boutonParTexte(container, 'Suivante'));
    });

    // Au moment ou data-revelee repasse a false, .instant DOIT etre pose
    // (transition coupee) : aucun retournement ne peut etre anime.
    expect(flipInner(container).getAttribute('data-revelee')).toBeNull();
    expect(flipWrap(container).className).toContain(styles.instant);

    // 3) Apres UNE seule frame peinte, .instant doit ENCORE etre present.
    //    => echoue avec l'ancien correctif (un seul rAF le retirait des cette frame).
    flushOneFrame();
    expect(flipWrap(container).className).toContain(styles.instant);

    // 4) Apres la 2e frame, la transition est retablie pour les flips volontaires suivants.
    flushOneFrame();
    expect(flipWrap(container).className).not.toContain(styles.instant);
  });

  it('le retournement VOLONTAIRE (clic sur la carte) reste anime (jamais .instant)', () => {
    const { container } = render(<Deck ctx={ctxStub()} pack={pack} />);

    act(() => {
      fireEvent.click(flipWrap(container));
    });

    // Un flip volontaire ne pose jamais .instant : l'animation de 0.6s est preservee.
    expect(flipInner(container).getAttribute('data-revelee')).toBe('true');
    expect(flipWrap(container).className).not.toContain(styles.instant);
    expect(rafQueue).toHaveLength(0); // aucun cycle "instant" programme
  });
});
