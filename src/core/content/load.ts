import { z } from 'zod';
import { QcmPack } from './qcm.schema';
import { ChronologiePack } from './chronologie.schema';
import { FlashcardsPack } from './flashcards.schema';
import { AtlasPack } from './atlas.schema';

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
  chronologie: ChronologiePack,
  flashcards: FlashcardsPack,
  atlas: AtlasPack,
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
// Le schema est indexe par une cle generique : on le traite en ZodTypeAny pour le
// safeParse, puis on retypage le resultat vers le pack attendu (PackByKind[K]).
export function parsePack<K extends ContentKind>(kind: K, raw: unknown): PackByKind[K] {
  const schema = SCHEMAS[kind] as z.ZodTypeAny;
  const res = schema.safeParse(raw);
  if (!res.success) {
    throw new ContentError(`Pack "${kind}" invalide : ${formatIssues(res.error)}`);
  }
  return res.data as PackByKind[K];
}
