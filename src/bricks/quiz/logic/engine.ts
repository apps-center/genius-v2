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
  graine: number; // graine du tirage : rend le melange des choix reproductible
}

// Nombre max de questions par partie (le reste du pack reste disponible aux tirages suivants).
export const DEFAULT_TAILLE = 10;

export function init(items: QcmItem[], seed = Date.now(), taille = DEFAULT_TAILLE): QuizState {
  const indices = melange(
    items.map((_, i) => i),
    seed,
  );
  const ordre = indices.slice(0, Math.min(taille, indices.length));
  return { ordre, courant: 0, score: 0, total: ordre.length, graine: seed };
}

// Graine du melange des choix pour la question a la position donnee.
// Derivee de la graine de partie : reproductible, mais distincte par question.
export function graineChoix(state: QuizState): number {
  return (state.graine + (state.courant + 1) * 1009) % 2147483647;
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

/*
  Melange des choix A L'AFFICHAGE.
  La bonne reponse est presque toujours en position 0 dans le contenu legacy :
  sans melange, l'enfant repondrait toujours "A". On permute donc les choix et on
  recalcule ou se trouve la bonne reponse APRES permutation. Pur et deterministe.
*/
export interface ChoixAffichage {
  ordre: number[]; // position affichee -> index d'origine dans item.choix
  bonneReponse: number; // position affichee de la bonne reponse
}

export function melangeChoix(
  nbChoix: number,
  bonneReponseOrigine: number,
  seed: number,
): ChoixAffichage {
  const ordre = melange(
    Array.from({ length: nbChoix }, (_, i) => i),
    seed,
  );
  return { ordre, bonneReponse: ordre.indexOf(bonneReponseOrigine) };
}

// Brassage de graine (variante splitmix32) : deux graines proches donnent des
// suites tres differentes. Sans lui, le Lehmer correle les graines voisines et
// la bonne reponse retomberait sur la meme case d'une question a l'autre.
function brasse(seed: number): number {
  let s = seed >>> 0;
  s = Math.imul(s ^ (s >>> 16), 0x45d9f3b);
  s = Math.imul(s ^ (s >>> 16), 0x45d9f3b);
  return (s ^ (s >>> 16)) >>> 0;
}

// PRNG deterministe (Lehmer) : tirages reproductibles pour les tests.
function melange(a: number[], seed: number): number[] {
  let s = brasse(seed) % 2147483647;
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
