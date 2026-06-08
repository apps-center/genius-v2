# Brique Quiz (QCM)

Activite de quiz a choix multiples. Elle consomme un `contentKind` `qcm` : elle
tourne sur n'importe quelle matiere (histoire, maths, arts...) tant que le pack
est valide. Elle ne connait jamais un sujet precis, seulement la forme du contenu.

## Frontiere (contrat 5.2)

`brick.tsx` expose EXACTEMENT `manifest`, `mount(container, ctx)`, `unmount()`.
Rien d'autre. La brique ne suppose rien de son exterieur sauf `ctx`.

## Decoupage interne

- `logic/engine.ts` : metier PUR (tirage des questions, scoring, melange des choix
  a l'affichage). Zero React, zero DOM. Teste par vitest (`logic/engine.test.ts`).
- `ui/` : rendu uniquement. Consomme `logic/`, n'a aucune regle metier.
- `ui/Quiz.module.css` : style 100 % via `var(--token)` de `src/styles/tokens.css`.
  Aucune valeur de couleur ni de mise en forme en dur.

## Boucle de jeu

question -> 4 choix melanges -> reponse -> feedback immediat (juste/faux +
explication) -> score -> ecran de fin. 10 questions tirees aleatoirement par partie.

Le melange des choix est essentiel : le contenu migre depuis le legacy place
TOUJOURS la bonne reponse en premier. Sans melange, l'enfant repondrait toujours
"A". `melangeChoix` permute les choix et recalcule la position de la bonne reponse.

## Evenements de domaine emis (via `ctx.events`)

- `activity.start` au montage de la partie.
- `answer.correct` / `answer.wrong` a chaque reponse.
- `activity.complete` (avec `score` / `total`) en fin de partie.

La brique ne sait RIEN de ce qui les consomme (gamification, telemetrie...).

## Lancer seule

```
npm run dev
```

Puis ouvrir une route de jeu, par exemple
`/play/quiz?sujet=histoire&titre=Pr%C3%A9histoire`.
`sujet` designe la matiere, `titre` desambigue la periode quand une meme matiere
porte plusieurs packs (ex. Prehistoire vs Antiquite).

## Ajouter un sujet (0 code)

1. Deposer un `.json` conforme au schema `qcm` dans `src/content/<matiere>/`.
2. Ajouter 1 ligne dans `src/app/registry.ts` (`CONTENT`).

Le pack apparait alors dans la nav, jouable par cette brique. Un pack malforme est
rejete au chargement avec un message clair (jamais d'ecran blanc).

## Schema du pack `qcm`

`src/core/content/qcm.schema.ts` :

```ts
QcmItem  = { id, question, choix[2..4], bonneReponse, explication?, niveau?, sujet? }
QcmPack  = { contentKind: 'qcm', sujet, titre, items[>=1] }
```

`sujet` au niveau item porte le theme d'origine de la question (ancien champ `era`
du quiz legacy) ; il s'affiche en etiquette sur la carte.
