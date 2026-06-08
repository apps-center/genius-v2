# CLAUDE.md - Projet Genius (Encyclopédie des Explorateurs)

Application éducative web pour enfants (collège, 6e-3e), déployée en statique sur Vercel.
Reconstruite en SPA React modulaire. L'objectif premier est la MODULARITÉ.

## Contrat de référence (À RESPECTER À CHAQUE BRIQUE)

L'architecture complète est décrite dans `docs/contrat-brique-activite-genius.md`.
Lis ce fichier avant de créer ou modifier une brique. Les §5 (contraintes) et §7 (definition of done) ne sont pas négociables.

## Idée directrice

Séparer la MÉCANIQUE (peu de briques d'activité : quiz, flashcards, timeline, logique) du CONTENU (beaucoup de packs JSON par sujet : histoire, maths, arts, sciences).
- Une brique consomme un `contentKind`, jamais un sujet précis. Le quiz tourne sur histoire OU maths OU arts.
- Ajouter un sujet = déposer 1 JSON validé + 1 ligne dans le registre. ZÉRO code métier.
- Ajouter une activité = écrire 1 brique conforme au contrat.

## Invariants critiques (les plus faciles à violer, donc à surveiller)

1. FRONTIÈRE DE BRIQUE : chaque brique expose exactement `manifest`, `mount(container, ctx)`, `unmount()`. Rien d'autre. La brique ne suppose rien de son extérieur sauf `ctx`.
2. CONTENU DÉCOUPLÉ : tout le contenu vit dans des packs JSON validés par Zod au chargement. JAMAIS de contenu en dur dans le JSX. Un pack invalide est rejeté avec un message clair, jamais d'écran blanc.
3. STYLE DÉCOUPLÉ : tout le style passe par `src/styles/tokens.css` (variables CSS) + CSS Modules. AUCUNE valeur de couleur ou de mise en forme en dur dans le JSX, aucun style inline. Changer le thème = remplacer tokens.css, zéro composant touché.
4. LOGIC PUR : la mécanique (tirage, scoring, révision espacée) vit dans `logic/` en TS pur, zéro React, zéro DOM, testée par vitest.
5. NAV GÉNÉRÉE : la page d'accueil et les routes sont construites depuis `src/app/registry.ts`. Rien de codé en dur.
6. PROGRESSION DÉCOUPLÉE : la progression passe par un store injecté via `ctx.progress`. localStorage par défaut, Supabase optionnel, même interface. Clés NAMESPACÉES par profil + numéro de VERSION de schéma (pour pouvoir migrer plus tard sans perdre les données).
7. ÉVÉNEMENTS DE DOMAINE : chaque brique émet ses actions signifiantes via `ctx.events` ('activity.complete', 'answer.correct', etc.) et ne sait RIEN de ce qui les consomme. Gamification, télémétrie et notifications sont des CONSOMMATEURS séparés. Ajouter une mécanique transverse = écrire un consommateur, jamais rouvrir une brique. Les règles de gamification sont déclaratives (pack JSON validé Zod).
8. ROBUSTESSE : le shell monte chaque brique dans un ErrorBoundary. Une brique qui plante n'abat pas l'app, elle affiche un fallback propre.

## Stack imposée

- React 18 + TypeScript strict + Vite (app SPA classique, PAS de lib mode).
- Routing : React Router. État transverse : Zustand (PAS de Redux). État UI : useState.
- Validation contenu : Zod. Graphes éventuels : Recharts (écran de stats seulement).
- Style : tokens.css + CSS Modules UNIQUEMENT. PAS de Tailwind, PAS de framework CSS.
- Animations flip : conserver le standard Genius (perspective 1200px, cubic-bezier(0.34, 1.4, 0.64, 1), .6s).

## Commandes

- `npm run dev` : lance l'app (ou une brique seule via son harnais de dev).
- `npm test` : tests vitest sur logic/ (sans navigateur).
- `npm run build` : build de production.

## Qualité enfant (en place de toute sécu métier)

- Accessibilité : contrastes AA, cibles tactiles >= 44px, navigation clavier, focus visible, aria sur les contrôles.
- Lisibilité : phrases courtes, feedback immédiat (juste / faux + explication), pas de mur de texte.
- Aucune collecte de données personnelles d'enfant. Aucun secret ni clé d'API dans le front (si Supabase : anon key + RLS).
- Jouable hors-ligne une fois chargé.

## Convention de rédaction (STRICTE)

- Ne JAMAIS utiliser le tiret cadratin (le caractère long). Utiliser un tiret simple ou reformuler. Vaut pour le code, les commentaires, la doc et l'UI.

## Definition of done (par brique)

- Ajouter un sujet pour cette brique = 1 JSON + 1 ligne de registre, 0 code. Il apparaît dans la nav.
- La brique se monte/démonte proprement : unmount ne laisse aucun timer/listener/abonnement actif.
- Le thème change sans toucher à un composant.
- La persistance bascule (localStorage -> Supabase) sans toucher à logic/ ni ui/.
- logic/ testé sans navigateur. Un pack malformé est rejeté avec message clair.
