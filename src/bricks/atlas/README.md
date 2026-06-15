# Brique `atlas` (carte du monde interactive)

Carte du monde geopolitique en SVG : on se deplace (glisser), on zoome (molette,
pincement, boutons), on survole un pays (infobulle) et on clique pour ouvrir sa fiche
detaillee. Une barre de couches permet de teinter la carte selon des donnees
thematiques (population, eau, climat, energie) ou d'y superposer des ressources et des
routes maritimes. Conforme au contrat de brique (`manifest` / `mount` / `unmount`).

## Frontiere

`brick.tsx` expose EXACTEMENT `manifest`, `mount(container, ctx)`, `unmount()`.
La brique ne connait que `ctx` et lit le pack a jouer dans l'URL
(`?sujet=...&titre=...`), comme les briques quiz et chronologie : elle fonctionne donc
seule (dev) comme dans le shell.

- `contentKind` consomme : `atlas`.
- `logic/` : mecanique PURE (zero React, zero DOM), testee par vitest :
  - `viewport.ts` : maths de pan / zoom focal borne, epaisseur de trait compensee.
  - `projection.ts` : projection equirectangulaire lon/lat -> coordonnees viewBox.
  - `colors.ts` : cascade de couleur d'un pays selon la couche (pays -> repli
    continental -> base ; zone climatique) et filtrage des ressources par groupe.
- `ui/` : rendu seul, en CSS Modules (`Atlas.module.css`), couleurs de THEME issues de
  `tokens.css` uniquement.
  - `useViewport.ts` : capte les gestes (Pointer Events : souris / doigt / stylet) et
    convertit l'ecran vers le repere viewBox via la CTM du SVG.
  - `App.tsx` : charge le pack, dessine la carte, orchestre couche active / survol /
    selection.
  - `Fiche.tsx` : panneau pays a 6 onglets. `LayerBar.tsx` : barre de couches.
    `Legende.tsx` : legende contextuelle. `Overlays.tsx` : ressources + maritime.

### Couleurs : theme vs donnees

Les couleurs de l'INTERFACE (fonds, textes, bordures, accents) viennent toutes de
`tokens.css`. En revanche les couleurs des PAYS et des couches (choropleth, climat,
ressources, routes) sont des DONNEES (palettes data-viz du pack) : elles sont posees en
attribut `fill` / `stroke` ou en variable dynamique cote rendu, jamais codees en dur.
Rethemer l'app ne touche pas ces palettes (et c'est voulu : ce sont des donnees).

## Evenements de domaine

- `activity.start` a l'ouverture de la carte.
- `atlas.country.selected` au clic sur un pays (ouverture de sa fiche).
- `atlas.layer.changed` au changement de couche.

La brique ne sait rien des consommateurs (gamification, telemetrie).

## Contenu

Un pack = un module atlas entier. Forme validee par Zod
(`src/core/content/atlas.schema.ts`), assemblee depuis l'ancien site :

```
{ contentKind:'atlas', sujet, titre, viewBox,
  pays: [ { id, iso3, name, cont, d, baseColor } ],   // geometrie SVG + couleur de base
  capitales: { iso2: string }, centroids: { iso2: [lon,lat] },
  fiches: { iso2: { name, flag?, capitale?, ... , histoire?, politique?, economie?,
                    societe?, environnement?, importance? } },   // format 6 sections
  couches: {
    colors: { demo|water|energy: { label, pays, continentDefaut, legende, source? } },
    climat: { label, data, zones },
    ressources: { meta, data, groupes:{ 'energy-res'|minerais } },
    maritime: { label, routes, detroits, niveauCouleurs }
  },
  navConfig: [ { id, label, emoji?, layers:[ { id, label, emoji?, type } ] } ]
}
```

Le `type` d'une couche (`base` | `colors` | `climat` | `ressources` | `maritime`)
pilote son rendu. Ajouter une couche = enrichir `navConfig` + les donnees dans
`couches`, zero code dans la brique.

## Migration des donnees

Tout le contenu de l'ancien site est rassemble par un script reproductible :

```
node scripts/migrer-atlas.mjs
```

Ce script :

1. extrait `const WORLD` (geometrie inline) du HTML legacy et le parse ;
2. recalcule la couleur de base de chaque pays (logique `baseFill` d'origine) et la fige
   dans `baseColor`, pour que la brique reste generique (zero logique de region) ;
3. fusionne les `fiches_pays*.json` et les fichiers de couches reellement implementees
   dans l'ancien site (geographie + economie) ;
4. normalise les tirets cadratin / demi-cadratin / signe moins en tiret simple ;
5. ecrit `src/content/atlas/monde.json` (valide ensuite par Zod et la suite de tests).

L'atlas n'utilise que des emojis : aucune image a copier.

## Perimetre

Premiere version a PARITE avec ce que l'ancien site implementait vraiment :
- Geographie : Monde, Population, Eau, Climat.
- Economie : PIB & Energie, Fossiles & Nucl., Minerais, Routes maritimes (+ detroits).

Les couches declarees mais jamais finies dans l'ancien site (empires, explorations,
langues, religions, conflits...) ne sont pas branchees : les ajouter consistera a
porter leurs donnees et a etendre `navConfig`, sans rouvrir la mecanique.

## Accessibilite

- Boutons de zoom, couches et onglets de fiche : vraies cibles tactiles (>= 44px),
  focus visible, `aria-pressed` / `aria-current`.
- Fiche : role complementaire, titre relie, fermeture croix + Echap, focus pose a
  l'ouverture (non modal pour garder la carte manipulable).
- Animations (routes, detroits) desactivees si `prefers-reduced-motion`.
- Limite connue : la selection d'un pays au clavier n'est pas encore offerte (la carte
  reste pilotable a la souris / au doigt). Une liste de pays recherchable, accessible
  au clavier, est prevue pour completer ce point.

## Ajouter un sujet d'atlas (ex. une carte regionale)

1. Produire un pack conforme au schema (geometrie + couches + fiches).
2. Ajouter 1 ligne dans `CONTENT` (registre) pointant le nouveau `.json`.
3. La validation Zod et la suite de tests le prennent en charge automatiquement.
