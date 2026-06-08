import { z } from 'zod';
import type { DomainEventName } from '../events/bus';

/*
  Regles de gamification DECLARATIVES, validees Zod comme le contenu.
  Ajouter un badge / une regle XP = ajouter un objet dans le pack, ZERO brique rouverte.
*/

const EVENTS: readonly DomainEventName[] = [
  'activity.start',
  'activity.complete',
  'answer.correct',
  'answer.wrong',
  'card.reviewed',
  'streak.advance',
];

export const GamificationRule = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  // Evenement de domaine declencheur.
  quand: z.enum(EVENTS as [DomainEventName, ...DomainEventName[]]),
  // Recompense en XP attribuee a chaque declenchement.
  xp: z.number().int().nonnegative().default(0),
  // Badge optionnel debloque par la regle.
  badge: z.string().optional(),
});

export const GamificationPack = z.object({
  regles: z.array(GamificationRule).min(1),
});

export type GamificationRule = z.infer<typeof GamificationRule>;
export type GamificationPack = z.infer<typeof GamificationPack>;

export function parseGamificationPack(raw: unknown): GamificationPack {
  const res = GamificationPack.safeParse(raw);
  if (!res.success) {
    throw new Error(
      `Pack gamification invalide : ${res.error.issues
        .map((i) => i.path.join('.') + ' ' + i.message)
        .join(' ; ')}`,
    );
  }
  return res.data;
}
