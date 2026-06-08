import type { QcmItem } from '../../../core/content/qcm.schema';

/*
  Moteur de quiz PUR : tirage, scoring. ZERO React, ZERO DOM. Testable seul (vitest).
  ui/ consomme ce moteur ; il ne contient AUCUNE regle metier.
*/

export interface QuizState {
  ordre: number[]; // indices melanges des items
  courant: number; // position dans ordre
  score: number;
  total: number;
}

// Nombre max de questions par partie (le reste du pack reste disponible aux tirages suivants).
export const DEFAULT_TAILLE = 10;

export function init(items: QcmItem[], seed = Date.now(), taille = DEFAULT_TAILLE): QuizState {
  const indices = melange(
    items.map((_, i) => i),
    seed,
  );
  const ordre = indices.slice(0, Math.min(taille, indices.length));
  return { ordre, courant: 0, score: 0, total: ordre.length };
}

// Index de l'item courant dans le tableau d'items source.
export function itemCourant(state: QuizState): number {
  return state.ordre[state.courant] ?? -1;
}

export function repondre(
  state: QuizState,
  items: QcmItem[],
  choix: number,
): { state: QuizState; correct: boolean } {
  const idx = itemCourant(state);
  const item = items[idx];
  const correct = !!item && item.bonneReponse === choix;
  return {
    state: {
      ...state,
      courant: state.courant + 1,
      score: state.score + (correct ? 1 : 0),
    },
    correct,
  };
}

export const fini = (s: QuizState): boolean => s.courant >= s.total;

// PRNG deterministe (Lehmer) : tirages reproductibles pour les tests.
function melange(a: number[], seed: number): number[] {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const out = [...a];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    const tmp = out[i] as number;
    out[i] = out[j] as number;
    out[j] = tmp;
  }
  return out;
}
