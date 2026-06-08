import { createStore, type StoreApi } from 'zustand/vanilla';
import type { AnswerRecord, ProgressStore } from './types';

/*
  Implementation localStorage de ProgressStore.
  Cle de persistance NAMESPACEE par profil et VERSIONNEE (migration future possible
  sans perdre les donnees). La brique ne voit que l'interface ProgressStore.
*/

// Numero de version du schema de progression. A incrementer si la forme change.
export const PROGRESS_SCHEMA_VERSION = 1;

interface ProgressData {
  version: number;
  free: Record<string, unknown>;
  answers: Record<string, AnswerRecord>;
}

const empty = (): ProgressData => ({
  version: PROGRESS_SCHEMA_VERSION,
  free: {},
  answers: {},
});

// Cle namespacee : genius:progress:v{n}:{profil}
function storageKey(profile: string): string {
  return `genius:progress:v${PROGRESS_SCHEMA_VERSION}:${profile}`;
}

// Intervalles de revision espacee (en ms) selon le nombre de reussites consecutives.
const JOUR = 24 * 60 * 60 * 1000;
const PALIERS = [0, JOUR, 3 * JOUR, 7 * JOUR, 21 * JOUR];

function load(profile: string): ProgressData {
  if (typeof localStorage === 'undefined') return empty();
  const raw = localStorage.getItem(storageKey(profile));
  if (!raw) return empty();
  try {
    const data = JSON.parse(raw) as ProgressData;
    // Garde-fou de version : si la version ne correspond pas, on repart propre
    // (point d'accroche pour une vraie migration plus tard).
    if (data.version !== PROGRESS_SCHEMA_VERSION) return empty();
    return { ...empty(), ...data };
  } catch {
    return empty();
  }
}

function persist(profile: string, data: ProgressData): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(storageKey(profile), JSON.stringify(data));
}

export function createProgressStore(profile: string): ProgressStore {
  const store: StoreApi<ProgressData> = createStore<ProgressData>(() => load(profile));

  const save = () => persist(profile, store.getState());

  return {
    get<T>(key: string): T | undefined {
      return store.getState().free[key] as T | undefined;
    },
    set<T>(key: string, value: T): void {
      store.setState((s) => ({ free: { ...s.free, [key]: value } }));
      save();
    },
    recordAnswer(itemKey: string, correct: boolean): void {
      store.setState((s) => {
        const prev = s.answers[itemKey] ?? { vues: 0, correctes: 0, derniereVue: 0 };
        const next: AnswerRecord = {
          vues: prev.vues + 1,
          // Une erreur casse la serie de reussites (revision espacee).
          correctes: correct ? prev.correctes + 1 : 0,
          derniereVue: Date.now(),
        };
        return { answers: { ...s.answers, [itemKey]: next } };
      });
      save();
    },
    nextDue(now = Date.now()): string[] {
      const { answers } = store.getState();
      return Object.entries(answers)
        .filter(([, rec]) => {
          const palier = PALIERS[Math.min(rec.correctes, PALIERS.length - 1)] ?? 0;
          return now - rec.derniereVue >= palier;
        })
        .map(([key]) => key);
    },
    reset(): void {
      store.setState(empty(), true);
      save();
    },
  };
}
