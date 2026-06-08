# Prompt type - Brique d'ACTIVITÉ éducative « Genius »

> Variante éducative du contrat de brique, dérivée de `prompt-type-microapp-labo-react.md`.
> Même philosophie de frontière `mount/unmount`, MAIS adaptée au registre enfant / contenu riche / déploiement Vercel.
> On a retiré tout le contexte métier santé : pas de Flask obligatoire, pas d'Ollama, pas de sécu données de santé, pas de build « librairie / shell hôte ».
> Idée directrice : **séparer la MÉCANIQUE (peu de briques) du CONTENU (beaucoup de packs JSON).**

---

## Ce qui change vs le contrat LBM (et ce qui reste)

| Élément | Contrat LBM (React) | Contrat Genius | Statut |
|---|---|---|---|
| Frontière brique (`manifest` / `mount` / `unmount`) | vanilla | identique | 🔒 conservé |
| Injection par `ctx` (inversion de dépendance) | oui | oui | 🔒 conservé |
| `logic/` métier pur testable (vitest) | oui | oui (moteurs de quiz / scoring / révision) | 🔒 conservé |
| `tokens.css` + CSS Modules | oui | oui | 🔒 conservé |
| Accès données découplé (`DataClient`) | Flask / Supabase santé | packs de CONTENU + store de PROGRESSION | 🔁 recentré |
| Build | mode librairie, React externalisé, shell hôte | app SPA normale (Vite), pas de lib mode | 🔁 simplifié |
| Backend | Flask sessions, routes /api protégées | aucun par défaut (JAMstack Vercel) ; Supabase optionnel | 🔁 retiré |
| IA | Ollama local via backend | aucune par défaut ; edge function si besoin | 🔁 retiré |
| Sécu 5.6 (RGPD santé, RLS, UFW, HSTS) | obligatoire | remplacée par checklist ENFANT (a11y, pas de secrets, COPPA-friendly) | 🔁 remplacé |
| Registre + découverte automatique | implicite | EXPLICITE : briques + packs auto-déclarés, nav générée | ➕ ajout clé |
| Validation de contenu | Zod sur formulaires | Zod sur les PACKS JSON (fini les trailing commas qui cassent tout) | ➕ ajout clé |

> Règle d'or inchangée : **le contrat décrit la frontière, pas l'intérieur.** Une brique Quiz et une brique Timeline cohabitent dès qu'elles respectent §5.2.
> Règle d'or ajoutée pour la modularité : **une brique consomme un TYPE de contenu, pas un sujet.** La brique Quiz tourne sur de l'histoire, des maths ou des arts tant que le pack est du bon `contentKind`.

---

## LE PROMPT

```
Tu es développeur d'une application éducative web pour enfants (collège), déployée en statique sur Vercel.
Tu construis une ACTIVITÉ conçue comme une BRIQUE React autonome, montable seule ou dans le shell de l'app Genius.
L'objectif premier est la MODULARITÉ : ajouter un sujet ne doit demander aucun code, ajouter un type d'activité
doit se limiter à écrire une brique conforme au contrat.

# 1. CAS D'USAGE
- Type d'activité : {{ ex. quiz QCM / flashcards / frise chronologique / jeu de logique / mode datation d'image }}
- Public : {{ ex. élèves de 6e à 3e }}
- Objectif pédagogique : {{ 1 à 2 phrases : ce que l'enfant apprend ou révise }}
- Boucle d'interaction : {{ ex. question -> réponse -> feedback immédiat -> score -> progression }}

# 2. CONTENU (la donnée, découplée de la mécanique)
- Le contenu vit dans des PACKS JSON validés par un schéma Zod, JAMAIS en dur dans les composants.
- Chaque pack déclare son `contentKind` (ex. 'qcm' | 'flashcards' | 'chronologie' | 'datation').
- Une brique déclare le ou les `contentKind` qu'elle sait consommer. Le registre fait l'appariement.
- Schéma du pack pour cette activité : {{ champs, ex. pour 'qcm' : { id, question, choix[], bonneReponse, explication?, niveau } }}
- Contenu non sensible, adapté enfants. Aucune donnée personnelle exigée pour jouer.

# 3. PROGRESSION (l'état, découplé lui aussi)
- La progression (scores, cartes vues, niveaux débloqués, révision espacée) passe par un STORE injecté via ctx.
- Persistance par défaut : localStorage (profil local enfant). Optionnel : Supabase pour le multi-appareil.
- La brique ne connaît QUE l'interface du store, jamais l'implémentation.

# 4. STACK
- React 18 + TypeScript (strict), Vite (app SPA classique, PAS de lib mode).
- Routing : React Router. Une route = une brique montée par le shell.
- État UI local : useState. État transverse (profil/progression) : Zustand (léger). PAS de Redux.
- Validation de contenu : Zod (au chargement de chaque pack). Graphes éventuels : Recharts (écran de stats seulement).
- Style : UNIQUEMENT tokens.css (variables CSS) + CSS Modules. PAS de Tailwind, PAS de framework CSS.
- Animations : conserver le standard Genius (perspective 1200px, cubic-bezier(0.34, 1.4, 0.64, 1) à .6s pour les flips).

# 5. CONTRAINTES NON NÉGOCIABLES - CONTRAT DE BRIQUE

## 5.1 Structure de dossier imposée
genius/
  package.json
  vite.config.ts          → app SPA (build standard, PAS de lib mode)
  index.html              → un seul point de montage : <div id="genius-root">
  src/
    main.tsx              → bootstrap : monte le shell sur #genius-root
    app/
      registry.ts         → REGISTRE : liste les briques + packs de contenu. Source unique de vérité.
      router.tsx          → routes GÉNÉRÉES depuis le registre (rien de codé en dur)
      shell.tsx           → layout + navigation GÉNÉRÉE depuis le registre
    core/
      context.tsx         → AppContext + hook useApp() exposant le ctx
      progress/           → store Zustand (progression) + persistance (localStorage | supabase). Interface stable. Schéma VERSIONNÉ + clés NAMESPACÉES par profil.
      content/            → loader + validation Zod des packs. ZÉRO React.
      events/             → EventBus : publie/abonne des ÉVÉNEMENTS DE DOMAINE. ZÉRO React. La colonne vertébrale du transverse.
      gamification/       → consommateur d'événements : règles déclaratives (XP, badges, séries) validées Zod. N'est PAS connu des briques.
    bricks/
      {{type}}/           → une brique = un type d'activité
        manifest.ts       → id, name, version, route, icon, contentKinds[], niveaux[]
        brick.tsx         → POINT D'ENTRÉE : export manifest, mount(), unmount()
        logic/            → métier PUR (TS) : tirage, scoring, révision espacée. ZÉRO React. Testable (vitest).
        ui/               → composants React : rendu uniquement. Consomment logic/, AUCUNE règle métier.
        {{type}}.module.css
    content/              → LES DONNÉES, par sujet (découplées de toute mécanique)
      histoire/ *.json
      mathematiques/ *.json
      arts/ *.json
      sciences/ *.json
    styles/
      tokens.css          → SEULES les valeurs de design (variables CSS). Aucune valeur métier.

## 5.2 Contrat d'export (frontière - chaque brique expose EXACTEMENT ça)
// src/bricks/{type}/brick.tsx
import { createRoot, type Root } from 'react-dom/client';
import { App } from './ui/App';
export { manifest } from './manifest';

let root: Root | null = null;
export function mount(container: HTMLElement, ctx: AppContext) {
  root = createRoot(container);
  root.render(<App ctx={ctx} />);
}
export function unmount() {
  root?.unmount();   // déclenche les cleanup useEffect : timers/listeners/abonnements libérés
  root = null;
}
→ ctx = { profile, progress, content, events, theme, settings }. La brique ne suppose RIEN de son extérieur sauf ctx.
→ Elle fonctionne identiquement montée SEULE (dev) ou dans le shell Genius.

## 5.3 Séparation design / fonctionnement (stricte)
- Tout le style vient de tokens.css partagé (couleurs, espacements, typo, rayons, ombres) en variables CSS.
- Les composants stylent via CSS Modules (scoping automatique) référençant var(--token).
- AUCUNE valeur de style en dur dans le JSX (pas de couleur, pas de px de mise en forme, pas de style inline).
- Changer le thème = remplacer tokens.css. Zéro composant React touché. Critère de recette.

## 5.4 Contenu découplé (le coeur de la modularité)
- Chaque pack JSON est validé par un schéma Zod AVANT usage. Un pack invalide est rejeté avec un message clair
  (et ne casse jamais l'app silencieusement : fini les trailing commas qui font planter sans rien dire).
- logic/ et ui/ ne connaissent QUE la forme typée du contenu (déduite du schéma Zod), jamais un fichier précis.
- Ajouter un sujet = déposer un nouveau .json conforme dans content/{sujet}/ et le déclarer au registre. ZÉRO code métier.

## 5.5 Progression découplée
- Interface ProgressStore (get / set / recordAnswer / nextDue / reset) injectée via ctx.progress.
- Implémentation par défaut : localStorage. Optionnelle : Supabase (mêmes signatures). La brique ne voit pas la différence.
- Aucune donnée personnelle requise pour jouer. Un « profil » est un pseudo local choisi par l'enfant.

## 5.6 Qualité enfant (checklist de recette - REMPLACE la sécu santé)
- [ ] Accessibilité : contrastes AA, cibles tactiles >= 44px, navigation clavier, focus visible, aria sur les contrôles.
- [ ] Lisibilité : phrases courtes, feedback immédiat et explicite (juste / faux + explication), pas de mur de texte.
- [ ] Aucun secret ni clé d'API dans le front. Si Supabase : anon key + RLS, jamais service_role côté client.
- [ ] Aucune collecte de données personnelles d'enfant (pas d'email, pas de tracking publicitaire). Analytics : Matomo self-host si besoin.
- [ ] CSP raisonnable, HTTPS (fourni par Vercel). Pas de contenu externe non maîtrisé.
- [ ] L'activité reste jouable hors-ligne une fois chargée (contenu statique embarqué).

## 5.7 Événements de domaine (le quatrième pilier - réservé dès le départ)
- Chaque brique ÉMET des événements de domaine via ctx.events à chaque action signifiante :
  'activity.start', 'activity.complete' (avec score/total), 'answer.correct', 'answer.wrong', 'card.reviewed', 'streak.advance', etc.
- La brique ne sait RIEN de ce qui consomme ces événements. Elle ne connaît que ctx.events.emit(...).
- Les consommateurs vivent à part et s'abonnent : gamification, télémétrie (anonyme), persistance, error reporting.
- Les règles de gamification sont DÉCLARATIVES : un pack JSON validé Zod (id, label, quand, condition, recompense),
  exactement comme le contenu. Ajouter un badge = ajouter un objet, ZÉRO modification de brique.
- Conséquence : on branche gamification, analytics ou notifications APRÈS COUP sans rouvrir une seule brique.
  C'est presque gratuit à réserver maintenant, très coûteux à rétrofiter plus tard.

# 6. LIVRABLES
- L'arborescence conforme à 5.1.
- Le schéma Zod du `contentKind` de la brique + AU MOINS un pack de contenu d'exemple valide.
- Un README court : but de la brique, lancement seul (npm run dev), ajout d'un sujet, ajout d'une activité.
- Au moins un test vitest sur logic/ (tirage / scoring), sans navigateur.
- La checklist 5.6 traitée.

# 7. DEFINITION OF DONE (centrée modularité)
- AJOUTER UN SUJET = déposer 1 JSON validé + 1 ligne dans le registre. 0 ligne de code métier. Il apparaît dans la nav.
- AJOUTER UNE ACTIVITÉ = 1 brique conforme à 5.2 déclarée au registre. Elle apparaît dans la nav.
- La navigation et la page d'accueil sont GÉNÉRÉES depuis le registre (rien codé en dur).
- On change le thème sans toucher à un composant (tokens.css seul).
- On bascule la persistance (localStorage -> Supabase) sans toucher à logic/ ni ui/.
- Un pack JSON malformé est rejeté avec un message clair, jamais d'écran blanc.
- logic/ est testé sans navigateur (vitest).
- La brique se monte/démonte proprement (unmount ne laisse aucun timer/listener/abonnement actif).
- AJOUTER UNE MÉCANIQUE TRANSVERSE (badge, niveau, télémétrie) = écrire un consommateur d'événements. 0 brique rouverte.
- La progression est stockée sous une clé namespacée par profil et porte un numéro de version de schéma (migration possible).
- Chaque brique est montée dans un ErrorBoundary par le shell : une brique qui plante ne casse pas l'app, fallback propre.
```

---

## Annexe A - Exemple minimal conforme (brique « quiz »)

Brique `quiz` réduite à l'os, plus un pack de contenu histoire. À utiliser comme gabarit.

**`src/bricks/quiz/manifest.ts`**
```ts
export const manifest = {
  id: 'quiz',
  name: 'Quiz',
  version: '0.1.0',
  route: '/quiz',
  icon: 'help-circle',
  contentKinds: ['qcm'] as const,   // ce que cette brique sait consommer
  niveaux: ['6e', '5e', '4e', '3e'] as const,
};
export type Manifest = typeof manifest;
```

**`src/core/content/qcm.schema.ts`** - le schéma Zod qui sécurise le contenu
```ts
import { z } from 'zod';

export const QcmItem = z.object({
  id: z.string(),
  question: z.string().min(1),
  choix: z.array(z.string().min(1)).min(2).max(4),
  bonneReponse: z.number().int().nonnegative(),
  explication: z.string().optional(),
  niveau: z.enum(['6e', '5e', '4e', '3e']).optional(),
});
export const QcmPack = z.object({
  contentKind: z.literal('qcm'),
  sujet: z.string(),          // 'histoire', 'mathematiques'...
  titre: z.string(),
  items: z.array(QcmItem).min(1),
});
export type QcmPack = z.infer<typeof QcmPack>;
export type QcmItem = z.infer<typeof QcmItem>;
```

**`src/core/content/load.ts`** - chargement + validation (jamais d'écran blanc silencieux)
```ts
import { QcmPack } from './qcm.schema';

export function parseQcmPack(raw: unknown): QcmPack {
  const res = QcmPack.safeParse(raw);
  if (!res.success) {
    // message clair, loggable, jamais un crash muet
    throw new Error(`Pack QCM invalide : ${res.error.issues.map(i => i.path.join('.') + ' ' + i.message).join(' ; ')}`);
  }
  return res.data;
}
```

**`src/bricks/quiz/logic/engine.ts`** - métier PUR, zéro React, testable seul
```ts
import type { QcmItem } from '../../../core/content/qcm.schema';

export interface QuizState { ordre: number[]; courant: number; score: number; total: number; }

export function init(items: QcmItem[], seed = Date.now()): QuizState {
  const ordre = melange(items.map((_, i) => i), seed);
  return { ordre, courant: 0, score: 0, total: items.length };
}

export function repondre(state: QuizState, items: QcmItem[], choix: number): { state: QuizState; correct: boolean } {
  const idx = state.ordre[state.courant];
  const correct = items[idx].bonneReponse === choix;
  return {
    state: { ...state, courant: state.courant + 1, score: state.score + (correct ? 1 : 0) },
    correct,
  };
}

export const fini = (s: QuizState) => s.courant >= s.total;

function melange(a: number[], seed: number): number[] {
  // PRNG simple déterministe (tests reproductibles)
  let s = seed % 2147483647; if (s <= 0) s += 2147483646;
  const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const out = [...a];
  for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [out[i], out[j]] = [out[j], out[i]]; }
  return out;
}
```

**`src/bricks/quiz/logic/engine.test.ts`** - vitest, aucun navigateur
```ts
import { describe, it, expect } from 'vitest';
import { init, repondre, fini } from './engine';

const items = [
  { id: 'a', question: 'Q1', choix: ['x', 'y'], bonneReponse: 0 },
  { id: 'b', question: 'Q2', choix: ['x', 'y'], bonneReponse: 1 },
];

describe('quiz engine', () => {
  it('init pose le bon total', () => {
    expect(init(items, 1).total).toBe(2);
  });
  it('compte les bonnes réponses et se termine', () => {
    let s = init(items, 1);
    s = repondre(s, items, items[s.ordre[s.courant]].bonneReponse).state;
    s = repondre(s, items, items[s.ordre[s.courant]].bonneReponse).state;
    expect(fini(s)).toBe(true);
    expect(s.score).toBe(2);
  });
});
```

**`src/app/registry.ts`** - source unique de vérité : briques + packs
```ts
import { manifest as quiz } from '../bricks/quiz/manifest';
// import { manifest as flashcards } from '../bricks/flashcards/manifest';

export const BRICKS = [quiz /*, flashcards, timeline, logique */] as const;

// Déclaration des packs de contenu. Ajouter un sujet = ajouter une ligne ici + le .json.
export const CONTENT = [
  { sujet: 'histoire', contentKind: 'qcm', titre: 'Antiquité', load: () => import('../content/histoire/antiquite-qcm.json') },
  // { sujet: 'mathematiques', contentKind: 'qcm', titre: 'Théorème de Pythagore', load: () => import('../content/mathematiques/pythagore-qcm.json') },
] as const;

// Apparie chaque pack avec les briques capables de le jouer.
export function briquesPour(contentKind: string) {
  return BRICKS.filter(b => (b.contentKinds as readonly string[]).includes(contentKind));
}
```

**`src/app/shell.tsx`** - nav GÉNÉRÉE depuis le registre (rien codé en dur)
```tsx
import { CONTENT, briquesPour } from './registry';

export function Hub() {
  return (
    <nav>
      {CONTENT.map(pack => (
        <section key={pack.sujet + pack.titre}>
          <h2>{pack.titre} <small>({pack.sujet})</small></h2>
          {briquesPour(pack.contentKind).map(b => (
            <a key={b.id} href={`${b.route}?sujet=${pack.sujet}&titre=${encodeURIComponent(pack.titre)}`}>
              {b.name}
            </a>
          ))}
        </section>
      ))}
    </nav>
  );
}
```

**`src/styles/tokens.css`** - le SEUL fichier à remplacer pour rethémer
```css
:root {
  --color-surface:#0f172a; --color-border:#1e293b;
  --color-text:#e2e8f0; --color-text-muted:#94a3b8;
  --color-accent:#2dd4bf; --color-accent-2:#a78bfa;
  --color-success:#22c55e; --color-warning:#f59e0b; --color-danger:#ef4444;
  --space-1:4px; --space-3:12px; --radius:12px;
  --font-sm:14px; --font-xl:28px;
  --flip-perspective:1200px;
  --flip-ease:cubic-bezier(0.34, 1.4, 0.64, 1);
  --flip-duration:.6s;
}
```

**`vite.config.ts`** - app SPA classique (PAS de lib mode)
```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({ plugins: [react()] });
```

---

## Annexe B - Pourquoi ces choix (rappel décisionnel)

| Exigence Genius | Mécanisme |
|---|---|
| Parfaitement modulable : ajouter un sujet sans coder | Packs JSON + registre + nav générée. 1 fichier + 1 ligne, 0 code métier. |
| Réutiliser une mécanique sur plusieurs sujets | `contentKind` : la brique consomme un TYPE, pas un sujet. Quiz tourne sur histoire, maths, arts. |
| Plus de JSON cassés en silence | Validation Zod au chargement, message d'erreur explicite au lieu d'un écran blanc. |
| Activités interactives complexes maîtrisées | logic/ pur testé (tirage, scoring, révision espacée) séparé du rendu ui/. |
| Démontage propre des activités | `root.unmount()` déclenche les cleanup useEffect : aucune fuite quand l'enfant change d'activité. |
| Rethémer sans casser | tokens.css + CSS Modules, zéro valeur en dur. |
| Progression sans engager d'infra | Store injecté : localStorage par défaut, Supabase si multi-appareil, même interface. |
| Adapté aux enfants | Checklist 5.6 a11y / lisibilité / zéro collecte, en place de la sécu santé du contrat LBM. |

> Versionne `tokens.css`, le contrat de frontière (`brick.tsx` type), les schémas Zod de contenu et l'interface `ProgressStore` comme un mini-SDK Genius.
> Tant que ces interfaces ne bougent pas, toutes tes briques et tous tes packs restent compatibles entre eux.
