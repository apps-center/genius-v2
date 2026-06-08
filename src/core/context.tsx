import { createContext, useContext, type ReactNode } from 'react';
import type { EventBus } from './events/bus';
import type { ContentClient } from './content/client';
import type { ProgressStore } from './progress/types';

/*
  AppContext - le SEUL point de couplage d'une brique avec l'exterieur.
  La brique ne suppose RIEN d'autre. Identique montee seule (dev) ou dans le shell.
*/

export interface Settings {
  // Reglages non sensibles (son, animations reduites...).
  reducedMotion: boolean;
}

export interface AppContext {
  profile: string; // pseudo local choisi par l'enfant
  progress: ProgressStore;
  content: ContentClient;
  events: EventBus;
  theme: string; // nom du theme actif (tokens.css)
  settings: Settings;
}

const Ctx = createContext<AppContext | null>(null);

export function AppProvider({ ctx, children }: { ctx: AppContext; children: ReactNode }) {
  return <Ctx.Provider value={ctx}>{children}</Ctx.Provider>;
}

export function useApp(): AppContext {
  const ctx = useContext(Ctx);
  if (!ctx) {
    throw new Error('useApp doit etre utilise dans un AppProvider');
  }
  return ctx;
}
