/*
  Interface ProgressStore - stable, injectee via ctx.progress.
  La brique ne connait QUE cette interface, jamais l'implementation
  (localStorage par defaut, Supabase optionnel : memes signatures).
*/

// Trace d'une reponse pour une cle de contenu donnee (sujet/item).
export interface AnswerRecord {
  vues: number;
  correctes: number;
  derniereVue: number; // timestamp
}

export interface ProgressStore {
  // Lit une valeur libre namespacee (scores agreges, niveaux debloques...).
  get<T = unknown>(key: string): T | undefined;
  set<T = unknown>(key: string, value: T): void;
  // Enregistre une reponse a un item ; alimente la revision espacee.
  recordAnswer(itemKey: string, correct: boolean): void;
  // Cles d'items dont la revision est due (revision espacee simple).
  nextDue(now?: number): string[];
  // Remet a zero la progression du profil courant.
  reset(): void;
}
