import { z } from 'zod';
import { QcmPack } from './qcm.schema';

/*
  Chargement + validation des packs. ZERO React.
  Un pack invalide est REJETE avec un message clair, jamais d'ecran blanc silencieux
  (fini les trailing commas qui cassent sans rien dire).
*/

// Erreur typee pour distinguer un pack malforme d'une vraie panne.
export class ContentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ContentError';
  }
}

function formatIssues(error: z.ZodError): string {
  return error.issues
    .map((i) => {
      const chemin = i.path.join('.') || '(racine)';
      return `${chemin} : ${i.message}`;
    })
    .join(' ; ');
}

// Map contentKind -> schema. Ajouter un contentKind = ajouter une entree ici.
const SCHEMAS = {
  qcm: QcmPack,
} as const;

export type ContentKind = keyof typeof SCHEMAS;

// Type du pack valide associe a chaque contentKind.
export type PackByKind = { [K in ContentKind]: z.infer<(typeof SCHEMAS)[K]> };

export function parseQcmPack(raw: unknown): QcmPack {
  const res = QcmPack.safeParse(raw);
  if (!res.success) {
    throw new ContentError(`Pack QCM invalide : ${formatIssues(res.error)}`);
  }
  return res.data;
}

// Generique : valide selon le contentKind attendu.
export function parsePack<K extends ContentKind>(
  kind: K,
  raw: unknown,
): z.infer<(typeof SCHEMAS)[K]> {
  const schema = SCHEMAS[kind];
  const res = schema.safeParse(raw);
  if (!res.success) {
    throw new ContentError(
      `Pack "${kind}" invalide : ${formatIssues(res.error)}`,
    );
  }
  return res.data as z.infer<(typeof SCHEMAS)[K]>;
}
