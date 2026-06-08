import type { EventBus } from '../events/bus';
import type { ProgressStore } from '../progress/types';
import { parseGamificationPack, type GamificationPack } from './rules.schema';

/*
  Consommateur d'evenements : applique des regles de gamification declaratives.
  Il ne connait AUCUNE brique. Il s'abonne au bus et ecrit dans la progression.
  Brancher la gamification = appeler attachGamification(...), jamais rouvrir une brique.
*/

const XP_KEY = 'gamification.xp';
const BADGES_KEY = 'gamification.badges';

export function attachGamification(
  bus: EventBus,
  progress: ProgressStore,
  rawPack: unknown,
): () => void {
  const pack: GamificationPack = parseGamificationPack(rawPack);
  const offs: Array<() => void> = [];

  for (const regle of pack.regles) {
    offs.push(
      bus.on(regle.quand, () => {
        if (regle.xp > 0) {
          const total = (progress.get<number>(XP_KEY) ?? 0) + regle.xp;
          progress.set(XP_KEY, total);
        }
        if (regle.badge) {
          const badges = progress.get<string[]>(BADGES_KEY) ?? [];
          if (!badges.includes(regle.badge)) {
            progress.set(BADGES_KEY, [...badges, regle.badge]);
          }
        }
      }),
    );
  }

  // Desabonnement propre (aucune fuite si on detache le consommateur).
  return () => offs.forEach((off) => off());
}
