import { parsePack, ContentError, type ContentKind, type PackByKind } from './load';

/*
  ContentClient - ce que la brique consomme via ctx.content.
  La brique demande un pack par (sujet, contentKind) ; elle ne connait jamais
  le chemin du fichier. Le registre fournit les loaders.
*/

// Une entree de contenu telle que declaree au registre.
export interface ContentEntry {
  sujet: string;
  contentKind: ContentKind;
  titre: string;
  // import dynamique du .json (Vite renvoie { default: ... } ou l'objet brut).
  load: () => Promise<unknown>;
}

export interface ContentClient {
  list(contentKind?: ContentKind): ContentEntry[];
  // Charge + valide. Rejette avec ContentError si le pack est malforme.
  loadPack<K extends ContentKind>(sujet: string, contentKind: K): Promise<PackByKind[K]>;
}

function unwrap(mod: unknown): unknown {
  // import('*.json') renvoie soit l'objet, soit { default: objet } selon le bundler.
  if (mod && typeof mod === 'object' && 'default' in mod) {
    return (mod as { default: unknown }).default;
  }
  return mod;
}

export function createContentClient(entries: readonly ContentEntry[]): ContentClient {
  return {
    list(contentKind) {
      return entries.filter((e) => !contentKind || e.contentKind === contentKind);
    },
    async loadPack(sujet, contentKind) {
      const entry = entries.find(
        (e) => e.sujet === sujet && e.contentKind === contentKind,
      );
      if (!entry) {
        throw new ContentError(
          `Aucun pack "${contentKind}" pour le sujet "${sujet}" dans le registre.`,
        );
      }
      const raw = unwrap(await entry.load());
      return parsePack(contentKind, raw);
    },
  };
}
