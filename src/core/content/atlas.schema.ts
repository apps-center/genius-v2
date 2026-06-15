import { z } from 'zod';

/*
  Schema Zod du contentKind 'atlas' (la carte du monde interactive). Securise le pack
  AVANT usage. Calque sur la structure reelle de l'ancien site (legacy/atlas_geopolitique.html
  + legacy/json/atlas/*.json), assemblee par scripts/migrer-atlas.mjs.

  Idee : tout le CONTENU (geometrie des pays, palettes data-viz, fiches, donnees de couches)
  vit dans le pack JSON valide ici ; la brique ne connait QUE la forme typee deduite, jamais
  un fichier precis. Les couleurs presentes sont des palettes de donnees (choropleth,
  ressources, climat) : elles font partie de la DONNEE, pas du theme UI (qui reste dans
  tokens.css). logic/ et ui/ ne lisent que ce schema.
*/

// --- Geometrie d'un pays : un trace SVG + ses metadonnees ---
export const PaysAtlas = z.object({
  id: z.string().min(1), // code ISO 3166-1 alpha-2 (ex. 'CN')
  iso3: z.string().min(1), // code alpha-3 (ex. 'CHN')
  name: z.string().min(1), // nom en anglais (issu des donnees source)
  cont: z.string().min(1), // continent ('Europe', 'Asia', 'North America', ...)
  d: z.string().min(1), // attribut `d` du <path> SVG
  // Couleur de base "Monde" deja calculee a la migration (logique baseFill du legacy) :
  // la brique l'applique telle quelle pour la couche 'world', sans logique de region.
  baseColor: z.string().min(1),
});

// --- Fiche pays : format structure homogene de l'ancien site (6 sections) ---
// Les champs sont rendus tels quels ; on tolere des sections absentes pour rester
// robuste si une fiche future est incomplete (jamais d'ecran blanc, juste moins de contenu).
const Histoire = z.object({
  independance: z.string().optional(),
  evenements_majeurs: z.array(z.string()).default([]),
  role_historique: z.string().optional(),
});
const Politique = z.object({
  regime: z.string().optional(),
  chef_etat: z.string().optional(),
  stabilite: z.string().optional(),
  alliances: z.array(z.string()).default([]),
});
const Economie = z.object({
  pib: z.string().optional(),
  pib_hab: z.string().optional(),
  ressources: z.array(z.string()).default([]),
  secteurs: z.array(z.string()).default([]),
  grandes_villes: z.array(z.string()).default([]),
  places_economiques: z.array(z.string()).default([]),
  voies_communication: z.array(z.string()).default([]),
});
const Societe = z.object({
  demographie: z.string().optional(),
  idh: z.string().optional(),
  education: z.string().optional(),
  sante: z.string().optional(),
  inegalites: z.string().optional(),
  urbanisation: z.string().optional(),
});
const Environnement = z.object({
  pollution: z.string().optional(),
  dev_durable: z.string().optional(),
  recherche: z.string().optional(),
  militaire: z.string().optional(),
  defis: z.array(z.string()).default([]),
});
const Importance = z.object({
  historique: z.string().optional(),
  economique: z.string().optional(),
  geopolitique: z.string().optional(),
  atouts: z.array(z.string()).default([]),
  fragilites: z.array(z.string()).default([]),
});

export const FicheAtlas = z.object({
  name: z.string().min(1),
  flag: z.string().optional(),
  capitale: z.string().optional(),
  continent: z.string().optional(),
  population: z.string().optional(),
  superficie: z.string().optional(),
  langues: z.array(z.string()).default([]),
  monnaie: z.string().optional(),
  histoire: Histoire.optional(),
  politique: Politique.optional(),
  economie: Economie.optional(),
  societe: Societe.optional(),
  environnement: Environnement.optional(),
  importance: Importance.optional(),
});

// --- Couches thematiques ---
const ItemLegende = z.object({ couleur: z.string().min(1), label: z.string().min(1) });

// Couche de type 'colors' (choropleth) : une couleur par pays, repli par continent.
const CoucheColors = z.object({
  label: z.string().min(1),
  pays: z.record(z.string()), // iso2 -> couleur
  continentDefaut: z.record(z.string()), // continent -> couleur de repli
  legende: z.array(ItemLegende).default([]),
  legendeTitre: z.string().optional(),
  source: z.string().optional(),
});

const ZoneClimat = z.object({
  color: z.string().min(1),
  label: z.string().min(1),
  icon: z.string().optional(),
});

const MetaRessource = z.object({
  icon: z.string().min(1),
  color: z.string().min(1),
  label: z.string().min(1),
});

const GroupeRessources = z.object({
  label: z.string().min(1),
  types: z.array(z.string().min(1)).min(1),
});

const RouteMaritime = z.object({
  name: z.string().min(1),
  pts: z.array(z.tuple([z.number(), z.number()])).min(2), // [lon, lat]
  color: z.string().min(1),
  w: z.number().positive(),
  traffic: z.string().optional(),
});

const Detroit = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  level: z.enum(['critical', 'high', 'medium']),
  pct: z.string().optional(),
  vol: z.string().optional(),
  desc: z.string().optional(),
  risk: z.string().optional(),
  lon: z.number(),
  lat: z.number(),
});

export const CouchesAtlas = z.object({
  // Couches choropleth (cle = id de couche : 'demo' | 'water' | 'energy').
  colors: z.record(CoucheColors).default({}),
  // Couche climat : zone par pays + palette des zones.
  climat: z
    .object({
      label: z.string().min(1),
      data: z.record(z.string()), // iso2 -> zone
      zones: z.record(ZoneClimat), // zone -> { color, label, icon }
    })
    .optional(),
  // Couches ressources : icones emoji posees au centroide, filtrees par groupe.
  ressources: z
    .object({
      meta: z.record(MetaRessource),
      data: z.record(z.array(z.string())), // iso2 -> [type, ...]
      groupes: z.record(GroupeRessources), // 'energy-res' | 'minerais' -> { label, types }
    })
    .optional(),
  // Couche maritime : routes (polylignes animees) + detroits (points pulses).
  maritime: z
    .object({
      label: z.string().min(1),
      routes: z.array(RouteMaritime).default([]),
      detroits: z.array(Detroit).default([]),
      niveauCouleurs: z.record(z.string()).default({}), // level -> couleur
    })
    .optional(),
});

// --- Navigation des couches (barre de categories) ---
const TypeCouche = z.enum(['base', 'colors', 'climat', 'ressources', 'maritime']);

const EntreeCouche = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  emoji: z.string().optional(),
  type: TypeCouche,
});

const CategorieNav = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  emoji: z.string().optional(),
  layers: z.array(EntreeCouche).default([]),
});

// --- Le pack complet ---
export const AtlasPack = z.object({
  contentKind: z.literal('atlas'),
  sujet: z.string().min(1),
  titre: z.string().min(1),
  viewBox: z.string().min(1), // ex. '0 0 1200 600'
  pays: z.array(PaysAtlas).min(1),
  capitales: z.record(z.string()).default({}),
  centroids: z.record(z.tuple([z.number(), z.number()])).default({}),
  fiches: z.record(FicheAtlas).default({}),
  couches: CouchesAtlas,
  navConfig: z.array(CategorieNav).default([]),
});

export type PaysAtlas = z.infer<typeof PaysAtlas>;
export type FicheAtlas = z.infer<typeof FicheAtlas>;
export type CouchesAtlas = z.infer<typeof CouchesAtlas>;
export type AtlasPack = z.infer<typeof AtlasPack>;
export type TypeCouche = z.infer<typeof TypeCouche>;
export type EntreeCouche = z.infer<typeof EntreeCouche>;
export type RouteMaritime = z.infer<typeof RouteMaritime>;
export type Detroit = z.infer<typeof Detroit>;
