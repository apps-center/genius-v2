# L'Encyclopédie des Explorateurs — Contexte Projet

Application web éducative interactive destinée à des **collégiens**, développée et maintenue par Olivier Hurmic. Déployée sur **Vercel** via GitHub. Pas de framework — HTML/CSS/JS vanilla uniquement.

---

## Architecture du projet

```
genius/
├── accueil.html                  ← Page d'accueil principale
├── quiz.html                     ← Module quiz QCM (180+ questions)
├── chronologie_historique.html   ← Frise interactive (charge les JSON dynamiquement)
├── atlas_geopolitique.html
├── arts.html
├── logique.html
├── mathematiques_module.html
├── sciences_module.html
│
├── flashcards/
│   ├── index.html                ← Hub flashcards (6 thèmes + Mode Genius)
│   ├── histoire.html             ← 206 cartes, filtres par époque
│   ├── mathematiques.html        ← 247 cartes, filtres par niveau (6e→3e) + catégorie
│   ├── geographie.html
│   ├── sciences.html
│   ├── art.html
│   ├── logique.html
│   └── genius.html               ← Mode toutes cartes mélangées
│
├── json/chronologie/
│   ├── prehistoire.json          ← Ère cosmique + biologique + préhistoire
│   ├── antiquite.json            ← Premières civilisations → Rome
│   ├── moyenage.json             ← Mérovingiens → fin du Moyen Âge
│   ├── tempsmodernes.json        ← Renaissance → Lumières
│   ├── contemporaine.json        ← Révolution → XXe siècle
│   ├── monde.json                ← Civilisations non-européennes
│   └── france.json               ← Histoire de France spécifique
│
└── img/
    ├── histoire/                 ← Images .webp des flashcards histoire
    └── ...
```

---

## Design System

**Palette**
```css
--bg: #060a14          /* fond principal bleu très sombre */
--star: #e8dfc4        /* texte principal crème */
--gold: #d4a843        /* doré — couleur accent principale */
--line: rgba(200,180,120,.18)
--card-bg: rgba(10,18,36,.92)
```

**Typographie**
- Titres : `Cinzel` (serif, Google Fonts) — small caps, letter-spacing élevé
- Corps : `Crimson Pro` (serif élégant)

**Règles de style absolues**
- Fond étoilé animé canvas sur toutes les pages (`#stars`)
- Pas d'animations `transform: translateY / scale` au hover sur les cartes — uniquement `border-color` + `box-shadow` léger
- Transitions hover : `border-color .25s, box-shadow .25s` — jamais de `cubic-bezier` élaboré sur les hovers
- Boutons et badges : font-family Cinzel, letter-spacing, UPPERCASE
- Pas de framework CSS, pas de Tailwind, pas de Bootstrap

---

## Flashcards — Architecture commune

Chaque fichier flashcard partage la même structure JS :

```javascript
const CARDS = [ { id, img, title, date, year, era, desc } ] // histoire
const ALL_CARDS = [ { id, cat, q, ans, exp, lv } ]          // maths
```

**Flip animation (paramètres identiques sur tous les fichiers)** :
```css
perspective: 1200px
transition: transform .6s cubic-bezier(0.34, 1.4, 0.64, 1)  /* élastique */
will-change: transform
```
```javascript
// advance() : overlay 0.18s + setTimeout 180ms + double requestAnimationFrame
// iris : 0.4s cubic-bezier(0.34, 1.2, 0.64, 1)
```
⚠️ Ces valeurs sont identiques sur TOUS les fichiers flashcard. Ne pas les modifier individuellement.

**histoire.html spécificités** :
- Filtre par époque (pilules dorées) : Préhistoire / Antiquité / Moyen Âge / Temps Modernes / Époque Contemporaine
- `EPOCH_MAP` mappe chaque filtre aux `era` correspondantes
- Images dans `img/histoire/*.webp`
- Descriptions pédagogiques niveau collège — pas de jargon sans explication

**mathematiques.html spécificités** :
- Double filtre : niveau scolaire (6e/5e/4e/3e) + catégorie (Fractions, Algèbre…)
- Champ `lv` sur chaque carte : `"6e"` `"5e"` `"4e"` `"3e"` (primaire fusionné avec 6e)
- 13 catégories : Fractions, Arithmétique, Calcul, Nombres relatifs, Proportionnalité, Algèbre, Géométrie, Grandeurs, Numération, Statistiques, Probabilités, Fonctions, Puissances

---

## Quiz (quiz.html)

- **180+ questions QCM** avec 4 choix, explication après chaque réponse
- **28+ Quiz Dates** (QCM sur les époques)
- 10 questions par session, tirées aléatoirement
- Récompense finale : trophée + étoiles selon score
- Abandon avec confirmation modale (score perdu si abandon)
- Navigation clavier : A/B/C/D pour répondre, Entrée pour suivant, Échap pour abandonner

**Base de questions couvre** : Ère cosmique, Préhistoire, Antiquité, Grèce, Rome, Moyen Âge, Renaissance, Monarchie absolue, Lumières, Révolution, XIXe, XXe siècle

⚠️ Les champs `quiz` ont été supprimés de tous les JSON (prehistoire, moyenage, antiquite) — les questions vivent uniquement dans `quiz.html`.

---

## Chronologie Historique (chronologie_historique.html)

- Charge les JSON dynamiquement via `fetch('/json/chronologie/*.json')`
- 7 branches : prehistoire, antiquite, moyenage, tempsmodernes, contemporaine, monde, france
- Structure d'un événement JSON :
```json
{
  "icon": "⚡",
  "tag": "Événement",
  "date": "476 ap. J.-C.",
  "title": "Chute de l'Empire romain d'Occident",
  "desc": "...",
  "anecdotes": [ { "e": "😏", "t": "<b>Texte</b> avec HTML autorisé" } ],
  "kind": "histoire",
  "img": "histoire/nom_image.webp"
}
```
- `kind` possible : `histoire`, `science`, `litterature`, `art`, `musique`
- **Pas de champ `quiz`** dans les JSON — supprimé définitivement, quiz dans `quiz.html`
- Les boutons Quiz ont été retirés de l'interface

---

## Conventions importantes

**Images**
- Format : `.webp` exclusivement
- Dossier : `img/histoire/` pour les flashcards histoire et la chronologie
- Nommage : snake_case ou avec espaces (les deux existent, ne pas renommer)
- Les images de la chronologie sont référencées comme `"img": "histoire/nom.webp"`

**Cartes histoire**
- Descriptions : niveau collège, accessibles, expliquer le jargon (ex: "maire du palais = chef du gouvernement qui gouverne à la place du roi")
- Dates en gros sur le verso (`.b-date` en 2rem bold doré)
- Chaque `era` correspond exactement aux valeurs dans `EPOCH_MAP`

**JSON chronologie**
- Ne jamais ajouter de champ `quiz` — les questions vont dans `quiz.html`
- Les `anecdotes` acceptent du HTML (`<b>`, `<i>`)
- `img` est optionnel mais recommandé

**Git**
- Branche principale : `main`
- Remote : `origin` (GitHub → Vercel auto-deploy)
- Dossiers importants : `json/chronologie/`, `flashcards/`, `img/histoire/`

---

## Pages et navigation

```
accueil.html
├── flashcards/index.html → flashcards/*.html
├── quiz.html
├── chronologie_historique.html
├── atlas_geopolitique.html
├── arts.html
├── logique.html
├── mathematiques_module.html
└── sciences_module.html
```

Le lien retour est `← Accueil` → `accueil.html` sur toutes les sous-pages.
Les flashcards ont leur propre lien retour → `flashcards/index.html`.

---

## Ce qui NE change PAS

- Le design étoilé — c'est l'identité visuelle du projet
- Les paramètres d'animation de flip (perspective 1200px, cubic-bezier élastique)
- La structure des données JSON chronologie
- La palette de couleurs CSS variables
