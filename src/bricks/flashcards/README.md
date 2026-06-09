# Brique `flashcards`

Un deck de cartes recto/verso qui se joue : on affiche une carte, on la retourne (clic
ou clavier), on navigue entre les cartes avec un indicateur de progression. Conforme au
contrat de brique (`manifest` / `mount` / `unmount`) et a la presentation decrite dans
`docs/audit-legacy.md` (section 3.2).

UN schema, DEUX modeles de carte distingues par le champ discriminant `type` :

- `image` : recto = image plein cadre (sans rognage, hauteur naturelle comme la frise),
  verso = epoque + date + titre + description. Utilise par histoire, arts...
- `qr` (question-reponse) : recto = categorie + question, verso = reponse + explication.
  Utilise par maths, logique...

## Perimetre

Cette brique couvre STRICTEMENT la mecanique d'un deck qui se joue. Ne sont PAS inclus
(reserves pour plus tard, coutures laissees en place) :

- l'ecran d'entree des flashcards (stats, grille de themes, Mode Genius qui melange tout) ;
- les filtres par categorie ou par niveau ;
- l'auto-evaluation "Je sais / A revoir" et la revision espacee.

Le schema (carte discriminee, deck possiblement mixte) et la logique (etat minimal :
position + face) sont concus pour accueillir ces ajouts sans rupture.

## Frontiere

`brick.tsx` expose EXACTEMENT `manifest`, `mount(container, ctx)`, `unmount()`. La brique
ne connait que `ctx`. Elle lit le deck a jouer dans l'URL (`?sujet=...&titre=...`),
exactement comme les briques quiz et chronologie : elle fonctionne donc seule (dev) comme
dans le shell.

- `contentKind` consomme : `flashcards`.
- `logic/deck.ts` : mecanique PURE (navigation, bornes, retournement). Zero React, testee
  par vitest (`logic/deck.test.ts`).
- `ui/` : rendu seul, en CSS Modules (`Flashcards.module.css`), couleurs et animation de
  flip issues de `tokens.css` uniquement (standard Genius : perspective 1200px,
  cubic-bezier elastique, .6s). Mouvement reduit respecte via `ctx.settings.reducedMotion`.

## Comment y jouer (avant l'ecran d'entree)

L'entree d'accueil "Flashcards" reste `a-venir` (l'ecran d'entree demande des choix d'UX
hors perimetre). Pour tester un deck, on monte la brique directement par son URL, comme
les modules :

```
/play/flashcards?sujet=arts&titre=Arts
/play/flashcards?sujet=logique&titre=Logique
```

## Evenements de domaine

- `activity.start` a l'ouverture du deck.
- `card.flipped` a chaque retournement (`face: 'recto' | 'verso'`).
- `deck.completed` quand la derniere carte du deck est atteinte (une seule fois).

La brique ne sait rien des consommateurs (gamification, telemetrie).

## Contenu

Un deck = un pack. Forme validee par Zod (`src/core/content/flashcards.schema.ts`) :

```
{ contentKind: 'flashcards', sujet, titre, cartes: [
    { type: 'image', id, image, titre, date, epoque?, description }
  | { type: 'qr', id, question, reponse, explication?, categorie?, difficulte? }
] }
```

Deux decks pilotes migres (`src/content/flashcards/*.json`), un par modele :

- `arts.json` : 48 cartes du deck Arts du legacy (modele image).
- `logique.json` : 30 cartes du deck Logique du legacy (modele question-reponse).

## Strategie d'images (modele image)

Identique a la frise chronologie :

1. **Copie selective** : seules les images referencees par le deck sont copiees.
2. **Slugification** : noms d'origine (espaces, accents, apostrophes) renommes en slug
   ascii (minuscules, tirets) pour des URLs robustes sans encodage.
3. **Service statique** : images copiees dans `public/img/flashcards/<deck>/`, servies a
   la racine par Vite. Le champ `image` du pack pointe `"/img/flashcards/<deck>/<slug>"`.

Reproductible via :

```
node scripts/migrer-flashcards.mjs arts
node scripts/migrer-flashcards.mjs logique
```

Le script lit le HTML legacy, convertit les tirets longs en tiret simple, copie/slugifie
les images (modele image) et ecrit le pack dans `src/content/flashcards/`.

## Ajouter un deck (passe ulterieure)

1. `node scripts/migrer-flashcards.mjs <deck>` (genere le pack + copie ses images).
2. Ajouter 1 ligne dans `CONTENT` (registre) pointant le nouveau `.json`.
3. La validation Zod et la suite de tests prennent le deck en charge automatiquement.
