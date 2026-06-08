/*
  EventBus - la colonne vertebrale du transverse. ZERO React, ZERO DOM.
  Une brique EMET des evenements de domaine ; elle ne sait RIEN de ce qui les consomme.
  Les consommateurs (gamification, telemetrie, persistance) s'abonnent ici.
*/

// Catalogue des evenements de domaine et de leur charge utile.
export interface DomainEvents {
  'activity.start': { brick: string; sujet: string };
  'activity.complete': { brick: string; sujet: string; score: number; total: number };
  'answer.correct': { brick: string; sujet: string; itemId: string };
  'answer.wrong': { brick: string; sujet: string; itemId: string };
  'card.reviewed': { brick: string; sujet: string; itemId: string };
  'streak.advance': { brick: string; valeur: number };
}

export type DomainEventName = keyof DomainEvents;

type Handler<E extends DomainEventName> = (payload: DomainEvents[E]) => void;

export interface EventBus {
  emit<E extends DomainEventName>(event: E, payload: DomainEvents[E]): void;
  on<E extends DomainEventName>(event: E, handler: Handler<E>): () => void;
}

export function createEventBus(): EventBus {
  const handlers = new Map<DomainEventName, Set<Handler<DomainEventName>>>();

  return {
    emit(event, payload) {
      const set = handlers.get(event);
      if (!set) return;
      // Copie defensive : un consommateur peut se desabonner pendant l'emission.
      for (const h of [...set]) {
        try {
          (h as Handler<typeof event>)(payload);
        } catch (err) {
          // Un consommateur qui plante n'interrompt pas les autres ni la brique.
          console.error(`[events] consommateur en echec pour "${event}"`, err);
        }
      }
    },
    on(event, handler) {
      let set = handlers.get(event);
      if (!set) {
        set = new Set();
        handlers.set(event, set);
      }
      set.add(handler as Handler<DomainEventName>);
      return () => {
        set?.delete(handler as Handler<DomainEventName>);
      };
    },
  };
}
