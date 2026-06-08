# Genius v2 - Encyclopedie des Explorateurs

SPA React modulaire. La MECANIQUE (briques d'activite) est separee du CONTENU
(packs JSON par sujet). Architecture et invariants : voir `CLAUDE.md` et
`docs/contrat-brique-activite-genius.md`.

## Commandes

- `npm install` : installe les dependances.
- `npm run dev` : lance l'app (Vite).
- `npm test` : tests vitest sur `logic/` et la validation de contenu (sans navigateur).
- `npm run build` : build de production.

## Architecture (increment 1)

```
src/
  app/        registry (source de verite), router + shell (nav GENEREE), ErrorBoundary, BrickHost
  core/       context, content (validation Zod), progress (store versionne + namespace), events (EventBus), gamification (consommateur)
  bricks/
    quiz/     manifest, brick.tsx (frontiere mount/unmount), logic/ (pur, teste), ui/
  content/    packs JSON par sujet (histoire/...)
  styles/     tokens.css (seules valeurs de design) + global.css
```

## Ajouter un SUJET (zero code metier)

1. Deposer un `.json` conforme dans `src/content/{sujet}/`.
2. Ajouter une ligne dans `CONTENT` (`src/app/registry.ts`).

Il apparait dans la nav. Un pack malforme est rejete au chargement avec un
message clair (validation Zod), jamais d'ecran blanc.

## Ajouter une ACTIVITE

Ecrire une brique conforme au contrat (`manifest`, `mount`, `unmount`) puis
l'ajouter a `BRICKS` dans `src/app/registry.ts`. Elle apparait dans la nav pour
tout pack dont elle declare le `contentKind`.

## Themer

Remplacer `src/styles/tokens.css`. Aucun composant a toucher (les valeurs sont
relevees de l'ancien site Genius : palette parchemin/or, Cinzel + Crimson Pro,
flip standard perspective 1200px / cubic-bezier(0.34, 1.4, 0.64, 1) / 0.6s).

## Progression

`ctx.progress` : localStorage par defaut, cle namespacee par profil et versionnee
(`genius:progress:v1:{profil}`). Bascule Supabase possible sans toucher `logic/`
ni `ui/` (meme interface `ProgressStore`).

## legacy/

`legacy/` est l'ancien site, SOURCE DE LECTURE SEULE. Ne pas le modifier, ne pas
le deployer (ignore via `.vercelignore`).
