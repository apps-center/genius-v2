import type { AppContext } from './context';
import { createEventBus } from './events/bus';
import { createProgressStore } from './progress/store';
import { createContentClient, type ContentEntry } from './content/client';

/*
  Assemble un AppContext concret a partir du registre de contenu.
  Persistance par defaut : localStorage (cf. progress/store). Bascule Supabase
  possible plus tard sans toucher logic/ ni ui/ (meme interface ProgressStore).
*/
export function createAppContext(
  contentEntries: readonly ContentEntry[],
  profile = 'invite',
): AppContext {
  const prefersReduced =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  return {
    profile,
    progress: createProgressStore(profile),
    content: createContentClient(contentEntries),
    events: createEventBus(),
    theme: 'genius',
    settings: { reducedMotion: !!prefersReduced },
  };
}
