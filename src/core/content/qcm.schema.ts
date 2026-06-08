import { z } from 'zod';

/*
  Schema Zod du contentKind 'qcm'. Securise chaque pack AVANT usage.
  logic/ et ui/ ne connaissent QUE la forme typee deduite ici, jamais un fichier precis.
*/

export const NIVEAUX = ['6e', '5e', '4e', '3e'] as const;
export const Niveau = z.enum(NIVEAUX);

export const QcmItem = z.object({
  id: z.string().min(1),
  question: z.string().min(1),
  choix: z.array(z.string().min(1)).min(2).max(4),
  bonneReponse: z.number().int().nonnegative(),
  explication: z.string().optional(),
  niveau: Niveau.optional(),
})
  // Coherence : l'index de bonne reponse doit exister dans le tableau de choix.
  .refine((it) => it.bonneReponse < it.choix.length, {
    message: 'bonneReponse hors des choix proposes',
    path: ['bonneReponse'],
  });

export const QcmPack = z.object({
  contentKind: z.literal('qcm'),
  sujet: z.string().min(1),
  titre: z.string().min(1),
  items: z.array(QcmItem).min(1),
});

export type QcmPack = z.infer<typeof QcmPack>;
export type QcmItem = z.infer<typeof QcmItem>;
export type Niveau = z.infer<typeof Niveau>;
