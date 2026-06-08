# Audit complet du site legacy (Encyclopedie des Explorateurs)

Cartographie fidele et exhaustive de l'ancien site present dans `legacy/`, destinee a servir
de reference pour la reconstruction en SPA React modulaire. Audit en lecture seule : aucun
fichier de `legacy/` n'a ete modifie. Les libelles exacts de l'interface sont cites entre
guillemets, dans leur orthographe d'origine.

> Convention : ce rapport respecte la regle du projet (pas de tiret cadratin). Les tirets
> longs presents dans certains libelles d'origine sont signales par la mention `[m-dash]`
> uniquement quand c'est utile, sinon transcrits en tiret simple.

---

## 0. Stack et deploiement

- Site **HTML/CSS/JS vanilla**, zero framework, un fichier `.html` autoporteur par ecran
  (style + script inline). Deploiement statique sur Vercel.
- `vercel.json` : reecritures d'URL
  - `/` -> `/accueil.html`
  - `/flashcards` et `/flashcards/` -> `/flashcards/index.html`
  - `/flashcards/:page` -> `/flashcards/:page.html`
- Identite visuelle commune a toutes les pages :
  - Palette : `--bg:#060a14` (bleu nuit), `--star:#e8dfc4` (creme), `--gold:#d4a843` (dore accent),
    `--line:rgba(200,180,120,.18)`, `--card-bg:rgba(10,18,36,.92)`.
  - Typo : titres `Cinzel` (small caps, letter-spacing eleve, UPPERCASE), corps `Crimson Pro`.
  - Fond `<canvas id="stars">` etoile anime (200 a 220 etoiles scintillantes) sur chaque page.
  - Animation de flip standard : `perspective:1200px`, `transition:transform .6s cubic-bezier(0.34,1.4,0.64,1)`.

---

## 1. Carte de navigation

Arborescence d'ensemble (accueil -> activite/module -> mode/theme -> jeu/vue) :

```
accueil.html  "L'Encyclopedie des Explorateurs"
│
├─ SECTION "Entrainement"  (2 grandes cartes carrees cote a cote)
│  │
│  ├─ "Flashcards"  -> flashcards/index.html
│  │   ├─ Bandeau "Mode Genius"  -> flashcards/genius.html
│  │   │     └─ Deck mixte ~861 cartes, tous themes mélanges (recto/verso adaptatif)
│  │   └─ Grille "Choisir un theme" (6 cartes) :
│  │         ├─ "Histoire"        -> histoire.html       (filtres par epoque)
│  │         ├─ "Geographie"      -> geographie.html     (filtres par categorie + SVG silhouettes)
│  │         ├─ "Mathematiques"   -> mathematiques.html  (double filtre niveau + categorie)
│  │         ├─ "Sciences & Nature" -> sciences.html     (filtres par categorie + SVG)
│  │         ├─ "Arts & Culture"  -> art.html            (recto = image plein cadre)
│  │         └─ "Logique"         -> logique.html        (badges de difficulte)
│  │
│  └─ "Quiz"  -> quiz.html
│        └─ Ecran d'entree = 3 cartes de mode :
│              ├─ "Quiz Questions" (QCM)   -> 10 questions QCM 4 choix -> ecran resultat
│              ├─ "Quiz Dates"            -> 10 QCM chronologie       -> ecran resultat
│              └─ "Quiz Images"           -> 10 images, saisie d'annee -> ecran resultat
│
└─ SECTION "Modules interactifs"  (grille de 6 cartes)
   ├─ "Chronologie Historique"  -> chronologie_historique.html  (frise verticale, 6 onglets d'epoque)
   ├─ "Atlas Geopolitique"      -> atlas_geopolitique.html      (carte SVG, 5 categories de couches)
   ├─ "Arts & Culture"          -> arts.html                    (galerie, filtre discipline + onglets d'epoque)
   ├─ "Logique & Raisonnement"  -> logique.html                 (5 chapitres x 5 exercices)
   ├─ "Mathematiques"           -> mathematiques_module.html    (3 onglets : frise / demos / anecdotes)
   └─ "Sciences & Nature"       -> sciences_module.html         (3 onglets : frise / experiences / anecdotes)
```

> A noter : il existe DEUX entrees distinctes pour "Logique", "Mathematiques", "Sciences",
> "Arts" et "Histoire/Geo" : une cote **Flashcards** (revision par cartes) et une cote
> **Modules interactifs** (cours/frise/exercices). Ce sont des ecrans differents qui partagent
> seulement le sujet.

### 1.1 Page d'accueil (`accueil.html`) - detail exact

En-tete :
- Sur-titre : "Portail des savoirs"
- Titre (h1) : "L'Encyclopedie des Explorateurs" (sur deux lignes)
- Tagline : "Voyage a travers l'histoire, la geographie et les sciences"
- Decor : un caractere "✦"

**Section "Entrainement"** (libelle de section : "Entrainement") - 2 cartes carrees :

1. Carte "Flashcards" (icone 🃏) -> `flashcards/index.html`
   - Badge : "Disponible"
   - Sous-titre : "Teste tes connaissances"
   - Description : "Retourne les cartes, memorise les reponses, accumule les points. Mode ⚡ Genius pour tout melanger."
   - Tags : "Histoire", "Geo", "Maths", "Sciences"

2. Carte "Quiz" (icone 🎯) -> `quiz.html`
   - Badge : "Disponible"
   - Sous-titre : "10 questions, une recompense"
   - Description : "QCM tires aleatoirement - tu dois finir pour obtenir ton score et decrocher ton trophee."
   - Tags : "QCM", "Dates", "🏆 Recompense"

**Section "Modules interactifs"** (libelle de section : "Modules interactifs") - grille de 6 cartes, dans cet ordre :

| Ordre | Titre carte | Icone | Cible | Tags |
|------|-------------|-------|-------|------|
| 1 | "Chronologie Historique" | 📜 | `chronologie_historique.html` | "Antiquite", "Moyen Age", "Moderne", "Contemporain" |
| 2 | "Atlas Geopolitique" | 🌍 | `atlas_geopolitique.html` | "Geographie", "Economie", "Capitales", "Continents" |
| 3 | "Arts & Culture" | 🎨 | `arts.html` | "Peinture", "Musique", "Litterature", "Frise" |
| 4 | "Logique & Raisonnement" | 🧠 | `logique.html` | "Suites", "Deduction", "Enigmes", "Progressif" |
| 5 | "Mathematiques" | 🔢 | `mathematiques_module.html` | "Frise", "Demonstrations", "Enigmes", "Histoire" |
| 6 | "Sciences & Nature" | 🔬 | `sciences_module.html` | "Frise", "Experiences", "Anecdotes", "Enigmes" |

Descriptions exactes des cartes de modules :
- Chronologie : "Remonte le temps des grandes civilisations jusqu'a l'epoque contemporaine. Empires, revolutions, decouvertes - toute l'histoire du monde sur une frise interactive."
- Atlas : "Explore les nations, les continents et les grandes dynamiques economiques mondiales. Superficie, population, PIB, richesses naturelles - la Terre comme tu ne l'as jamais vue."
- Arts : "Voyage a travers les grands mouvements artistiques - Renaissance, Baroque, Impressionnisme, Modernisme. OEuvres, artistes, fiches et galerie interactive."
- Logique : "Suites, syllogismes, probabilites, enigmes - 25 exercices progressifs avec correction etape par etape. Entraine-toi comme pour un vrai concours."
- Mathematiques : "Des os d'Ishango au paradoxe de Cantor - frise des decouvertes, demonstrations SVG animees, anecdotes et enigmes. Pythagore, Gauss, Euler, et bien d'autres."
- Sciences : "D'Archimede a Hubble - frise chronologique, experiences emblematiques en SVG, anecdotes sur Darwin, Curie, Pasteur, Einstein. La science racontee comme une aventure."

Pied de page : "L'Encyclopedie des Explorateurs · Culture generale interactive".

Toutes les cartes portent le badge "Disponible". Le code prevoit un etat "a venir" (classe
`.coming` + badge grise `coming-badge`) mais aucune carte ne l'utilise actuellement.

---

## 2. Inventaire des pages `.html`

### Racine `legacy/`

| Fichier | Titre affiche (`<title>` / h1) | Role | Pointe vers / charge |
|---------|-------------------------------|------|----------------------|
| `accueil.html` | "L'Encyclopedie des Explorateurs" | Page d'accueil, portail | les 8 pages d'activites/modules |
| `quiz.html` | "Quiz" | Module quiz QCM/Dates/Images | donnees QCM inline (180 QCM, 28 dates, 25 images) |
| `chronologie_historique.html` | "Chronologie Historique" | Frise historique interactive | `fetch /json/chronologie/*.json` (6 branches) |
| `atlas_geopolitique.html` | "Atlas Geopolitique Mondial" | Carte SVG interactive | `fetch /json/atlas/*.json` (capitales, fiches_pays 1-6, climat, ressources, routes, detroits, etc.) |
| `arts.html` | "Arts & Culture" | Galerie artistique par discipline/epoque | `fetch json/arts/arts-data.json` |
| `logique.html` | "Logique & Raisonnement" | 5 chapitres x 5 exercices interactifs | objet JS `CHAPITRES` inline (25 exercices) |
| `mathematiques_module.html` | "Mathematiques" | Cours : frise + demos SVG + anecdotes | contenu HTML/SVG inline |
| `sciences_module.html` | "Sciences & Nature" | Cours : frise + experiences SVG + anecdotes | contenu HTML/SVG inline |
| `vercel.json` | n/a | Reecritures d'URL | - |
| `CLAUDE.md` | n/a | Doc projet legacy | - |

### Sous-dossier `legacy/flashcards/`

| Fichier | Titre affiche | Role | Retour |
|---------|--------------|------|--------|
| `index.html` | "Flashcards" | Hub flashcards : stats + Mode Genius + grille 6 themes | `/accueil.html` |
| `genius.html` | "⚡ Mode Genius" | Deck mixte, agrege les 6 themes dynamiquement | `index.html` |
| `histoire.html` | "Flashcards Historiques" | Deck histoire (recto image) | `/flashcards/index.html` |
| `geographie.html` | "Flashcards Geographie" | Deck geo (recto question + SVG silhouettes) | `/flashcards/index.html` |
| `mathematiques.html` | "Flashcards Mathematiques" | Deck maths (double filtre) | `/flashcards/index.html` |
| `sciences.html` | "Flashcards Sciences" | Deck sciences (recto + SVG) | `/flashcards/index.html` |
| `art.html` | "Arts & Culture" | Deck arts (recto image plein cadre) | `/flashcards/index.html` |
| `logique.html` | "Flashcards Logique" | Deck logique (badges difficulte) | `/flashcards/index.html` |

> Les decks de flashcards stockent leurs cartes en `const CARDS` (histoire, art : `{id,img,title,date,year,era,desc}`)
> ou `const ALL_CARDS` (maths, geo, sciences, logique : `{id,cat,q,ans,exp,...}`). Le Mode Genius
> va chercher ces tableaux directement dans le HTML des 6 decks.

### Dossiers de donnees et d'images

- `legacy/json/chronologie/` : `prehistoire.json`, `antiquite.json`, `moyenage.json`,
  `tempsmodernes.json`, `contemporaine.json`, `monde.json` (+ une branche `france` evoquee
  dans la structure mais non chargee par le `fetch`).
- `legacy/json/atlas/` : ~30 fichiers (capitales, centroids, climat[+colors], detroits[+colors],
  empires, explorations, fiches_pays + fiches_pays_2..6, guerre_froide, langues, layer_colors,
  libre_echange, migrations_prehistoriques, militaire_nucleaire, pandemies, religions,
  ressources[+meta], routes_maritimes, securite_alimentaire, soft_power, catastrophes, nav_index...).
- `legacy/json/arts/arts-data.json` : donnees de la galerie Arts.
- `legacy/img/histoire/` (~300 `.webp`), `legacy/img/arts/` (~70 `.webp`), `legacy/img/infographies/`.
- `legacy/archives/` : anciennes versions (atlas v1/v2, chronologie x/v1, timeline multiple...). A ignorer.

---

## 3. Parcours detaille par type d'activite

### 3.1 Quiz (`quiz.html`)

En-tete : sur-titre "L'Encyclopedie des Explorateurs", h1 "Quiz",
tagline "10 questions, une recompense - es-tu a la hauteur ?".

Barre de stats affichee sur l'ecran d'entree : "180+ Questions QCM", "200+ Dates historiques",
"10 Questions par quiz" (le "200+" est aspirationnel : seulement 28 dates en base).

**Selection = choix d'un MODE** (pas de selection par theme ; les questions sont tirees
aleatoirement, melangees tous sujets confondus). 3 cartes de mode :

1. "Quiz Questions" (icone 🎯)
   - "10 QCM tires aleatoirement - 4 choix par question. Reponds, decouvre la bonne reponse, et accumule les points."
   - Badge : "QCM · 4 choix · Histoire"
2. "Quiz Dates" (icone 🗓️)
   - "Un evenement historique s'affiche - tu dois retrouver son siecle ou son annee. Teste ta memoire des reperes chronologiques."
   - Badge : "QCM · Chronologie · Epoque"
3. "Quiz Images" (icone 🖼️)
   - "Une image historique - devine l'annee de l'evenement. Entree libre : plus tu es precis, plus tu marques de points !"
   - Badge : "Libre · Dates · /20 points"

**Deroule d'une partie** : `QUIZ_LENGTH = 10` questions par session (pool melange puis `slice(0,10)`).
Ecran de question : tag d'epoque (ex. "Antiquite"), enonce, soit 4 choix A/B/C/D (positions melangees),
soit (mode Images) une image `.webp` + un champ de saisie d'annee + un indice "💡 ...". Rangee de 10
pastilles de progression (current/done-ok/done-ko/done-mid). Ligne de score :
"Question N / 10 · Score : X / Y". Apres reponse : encart de feedback ("✓ Bonne reponse ! ...",
"✗ Rate - ...", ou en mode Images "✓ Parfait ! ...", "★ Proche ! ..."), puis bouton
"Question suivante →" (ou "Voir mon score →" a la 10e).

**Score / recompense** : sur 10 (QCM/Dates) ou sur 20 (Images, 0/1/2 pt par carte). Ecran final :
trophee anime + etoiles + message, selon le pourcentage :

| % | Trophee | Etoiles | Message (QCM/Dates) |
|---|---------|---------|---------------------|
| 100% | 🏆 | ⭐⭐⭐⭐⭐ | "Parfait ! Tu es un veritable explorateur du savoir..." |
| 80-99% | 🥇 | ⭐⭐⭐⭐ | "Excellent ! Tu maitrises tres bien ce chapitre..." |
| 60-79% | 🥈 | ⭐⭐⭐ | "Bien joue ! Tu as de bonnes bases..." |
| 40-59% | 🥉 | ⭐⭐ | "Pas mal pour un debut !..." |
| 0-39% | 📚 | ⭐ | "Le voyage commence ici !..." |

Boutons de fin : "🔄 Rejouer", "⇄ Changer de mode" (cycle qcm -> dates -> images), "✕ Fermer".

**Abandon** : bouton "✕ Abandonner" (ou touche Echap) -> modale "Abandonner le quiz ?" avec message
"Si tu quittes maintenant, ta progression sera perdue et tu n'obtiendras pas ton score final.",
boutons "Continuer" (reprend) et "Abandonner" (quitte, score perdu, aucune recompense).

**Clavier** : A/B/C/D pour choisir, Entree pour valider/suivant, Echap pour abandonner.

**Base de questions** (inline) : `QCM` 180 questions, `DATE_QCM` 28, `IMAGE_QUIZ` 25.
Epoques couvertes : "Ere Cosmique", "Ere Biologique", "Prehistoire", "Premieres Civilisations",
"Egypte & Mesopotamie", "Proche-Orient antique", "Grece Antique", "Rome Antique", "Carolingiens",
"Capetiens", "Renaissance", "Guerres de Religion", "Monarchie Absolue", "Lumieres", "Revolution",
"XIXe siecle", "XXe siecle", "Histoire du monde".

Retour : "← Accueil" -> `accueil.html`.

### 3.2 Flashcards

**Hub (`flashcards/index.html`)** :
- En-tete : sur-titre "L'Encyclopedie des Explorateurs", h1 "Flashcards", tagline "Retourne les cartes, memorise, progresse".
- Barre de stats (3 compteurs) : "424" "Cartes disponibles", "6" "Themes actifs", "0" "Themes a venir".
- Bandeau "Mode Genius" (icone ⚡) -> `genius.html` : titre "Mode Genius",
  description "Toutes les cartes melangees, tous les themes confondus. Le vrai test de culture generale - pour ceux qui n'ont peur de rien.", bouton "Lancer le defi →".
- Libelle de grille : "Choisir un theme". 6 cartes (toutes badge "Disponible") avec un compteur de cartes :

| Theme | Icone | Compteur affiche | Description | Tags |
|-------|-------|------------------|-------------|------|
| "Histoire" | 🏛️ | "109 cartes" | "Des grandes civilisations a l'epoque contemporaine..." | Antiquite, Moyen Age, Revolutions, XXe siecle |
| "Geographie" | 🌍 | "155 cartes" | "Capitales, pays, reliefs, fleuves et grandes dynamiques geopolitiques..." | Capitales, Continents, Reliefs |
| "Mathematiques" | 🔢 | "100 cartes" | "Fractions, relatifs, proportionnalite, algebre, geometrie..." | Fractions, Algebre, Geometrie, Relatifs |
| "Sciences & Nature" | 🔬 | "155 cartes" | "SVT, physique, chimie - du noyau atomique aux ecosystemes..." | SVT, Physique, Chimie |
| "Arts & Culture" | 🎨 | "30 cartes" | "Peinture, musique, litterature, theatre, cinema..." | Peinture, Musique, Litterature, Theatre |
| "Logique" | 🧠 | "30 cartes" | "Suites, deduction, probabilites, enigmes..." | Suites, Deduction, Enigmes, ⭐⭐⭐ |

> Ecart de comptage : les compteurs affiches (109/155/100/155/30/30, total "424") ne correspondent
> pas exactement au contenu reel des decks observe dans le code (histoire ~206, maths ~247,
> sciences ~175, art ~48). A normaliser lors de la reconstruction.

**Deroule d'un deck (tronc commun)** :
- Carte recto/verso, flip au clic. Pied recto : "Cliquez pour reveler" (histoire :
  "Cliquez pour reveler · re-cliquez pour passer").
- Controles de navigation identiques partout : "← Precedente", "Suivante →" (bouton dore), "🔀 Melanger".
- Apres revelation (libelle "Apres avoir revele la carte :") : deux boutons d'auto-evaluation.
  - Standard : "✓ Je savais" (vert) / "↩ A revoir" (rouge), compteurs "Connues / A revoir / Restantes".
  - Art : "✓ Je sais" / "↩ A revoir".
  - Logique : "✓ Trouve !" / "↩ A retravailler", compteur "Resolues / A revoir / Restantes".
- Progression "Carte X / N" + barre de progression + bandeau de vignettes en bas de page.
- Clavier : Fleche droite / Espace = suivant, Fleche gauche = precedent, Entree = retourner,
  K = je sais, R = a revoir.
- Retour : "← Flashcards" -> `flashcards/index.html`.

**Specificites par deck** :
- `histoire.html` : recto = grande image `.webp`; verso = badge d'epoque, grande date doree (`.b-date`),
  titre, description. Filtre par epoque (libelle "Filtrer par epoque", pilules dorees) :
  "⏳ Toutes les epoques" (defaut), "🦕 Prehistoire", "🏛️ Antiquite", "⚔️ Moyen Age",
  "⚜️ Temps Modernes", "🏭 Epoque Contemporaine". Tiroir "📜 Approfondir" (panneau lateral avec
  image, badge, anecdotes "✦ Anecdotes & curiosites").
- `mathematiques.html` : recto = badge categorie + question (+ SVG optionnel); verso = reponse + explication.
  Double filtre :
  - Niveau (libelle "Filtrer par niveau") : "⭐ Tous niveaux", "📚 Primaire & 6eme", "🟢 5eme", "🟡 4eme", "🔴 3eme".
  - Categorie (13) : "Tout", "Fractions", "Arithmetique", "Nombres relatifs", "Proportionnalite",
    "Algebre", "Geometrie", "Grandeurs", "Numeration", "Statistiques", "Probabilites", "Fonctions", "Puissances".
- `geographie.html` : recto = question + SVG silhouette de pays (avec pays/mers voisins etiquetes).
  Filtre par categorie (8) : "Tout", "🌍 Pays & Capitales", "🗺️ Silhouettes", "🏔️ Reliefs & Milieux",
  "🌐 Geopolitique", "💰 Ressources & Eco.", "🌱 Environnement", "🧭 Reperes".
- `sciences.html` : recto = question + SVG (cellule, systeme solaire, atome, photosynthese, phases lunaires...).
  Filtre par categorie (8) : "Tout", "🌿 SVT", "🫁 Digestion", "⚡ Physique", "🧪 Chimie",
  "🌌 Astronomie", "🔋 Energie", "🚀 Mouvements".
- `art.html` : recto = image plein cadre avec degrade; verso = badge d'epoque, date, titre, description.
  Pas de filtre. Vignettes = miniatures des oeuvres.
- `logique.html` : recto = badge categorie + badge de difficulte en coin ("⭐ Facile", "⭐⭐ Moyen",
  "⭐⭐⭐ Difficile"); verso = reponse + explication. Filtre par categorie (6) : "Tout", "🔢 Suites",
  "🧠 Deduction", "🎲 Probabilites", "⚡ Calcul rapide", "🔮 Enigmes".

**Mode Genius (`flashcards/genius.html`)** :
- Ecran de chargement : anneau anime + "Chargement des themes…", liste progressive
  "Chargement : 🏛️ Histoire… ✓ (N cartes)" par theme.
- Agrege dynamiquement les 6 decks (fetch des HTML, extraction de `CARDS`/`ALL_CARDS`), normalise
  chaque carte en `_theme`, `_type` ("image" pour histoire, "qa" sinon), `_themeLabel`, `_themeColor`.
- UI de jeu : barre de progression "Carte X / TOTAL" + badge de theme colore (emoji + nom).
  Recto adaptatif (image pour histoire, question pour le reste). Verso : "À revoir ↩" / "Je sais ! ✓".
  Navigation : "← Precedent", "Melanger", "Recommencer".
- Ecran de fin : "🏆", titre "Genius Accompli !", "N cartes traversees · tous les themes confondus",
  message "Tu as traverse toutes les cartes du Mode Genius. Impressionnant.", boutons
  "Rejouer →" et "Changer de theme" (-> `index.html`).
- Retour : "← Flashcards" -> `index.html`.

### 3.3 Frise chronologique (`chronologie_historique.html`)

- Acces depuis la carte "Chronologie Historique" de l'accueil.
- En-tete : sur-titre "De la naissance de l'univers a nos jours", h1 "Chronologie Historique",
  tagline "Explore 13,8 milliards d'annees d'histoire en cartes interactives".
- Donnees chargees par `fetch('/json/chronologie/<branche>.json')` pour 6 branches :
  prehistoire, antiquite, moyenage, tempsmodernes, contemporaine, monde.
- Navigation par 6 onglets (grille collante 2x3) : "🦴 Prehistoire", "🏛️ Antiquite", "⚔️ Moyen Age",
  "⛵ Temps Modernes", "🏭 Epoque Cont.", "🌍 Civilisations". Un clic change de branche et remonte en haut.
- Affichage : frise verticale a colonnes alternees (gauche/droite) avec ligne centrale ; en mobile,
  une colonne. Chaque carte d'evenement : icone (`.cicon`), tag (`.ctag`, ex. "Evenement"), date
  (`.cdate` en Cinzel UPPERCASE), titre (`.ctitle`), description (`.cdesc`), indice au survol
  "✦ Cliquer pour les anecdotes". Image miniature optionnelle (`.ev-img`) du cote oppose.
- Interaction : clic carte ou image (ou Entree/Espace au clavier) -> modale avec image, texte, anecdotes.
- Types d'evenements (`kind`) : "histoire" (carte complete) + pilules de decouverte pour
  "science" ("Science & Invention", 🔬), "litterature" ("Litterature", 📖), "art" ("Art", 🎨),
  "musique" ("Musique", 🎵). Legende fixe en bas listant ces 5 categories.
- Retour : "← Accueil" -> `accueil.html`.

### 3.4 Atlas Geopolitique (`atlas_geopolitique.html`)

- En-tete/titre : "Atlas Geopolitique Mondial".
- Carte du monde en **SVG** (viewBox 1200x600), pays cliquables, zoom/pan a la molette et au drag,
  controles "+/−" en bas a droite. Etiquette de couche en haut a gauche (ex. "CLIMAT").
- Navigation a **deux niveaux** :
  1. Onglets de categorie (barre du haut, 5) : "🌍 Geo", "💰 Eco", "⚔️ Histoire", "🌱 Enviro", "📊 Infographies".
  2. Barre de couches (sous les onglets), variable selon la categorie :
     - Geo : "🌍 Monde", "👥 Population", "💧 Eau", "🌡 Climat".
     - Eco : "⚡ PIB & Energie", "🛢 Fossiles & Nucl.", "⛏ Minerais", "🚢 Routes maritimes".
     - Histoire : "— A venir —". Enviro : "— A venir —".
     - Infographies : bascule vers une grille de cartes ("Eau & Securite alimentaire",
       "Ressources naturelles mondiales") ouvrant une image plein ecran zoomable.
- Fiche pays (panneau lateral droit au clic d'un pays) : en-tete drapeau + nom + "🏛 Capitale" +
  continent, grille de stats cles ("Population", "PIB", "Superficie", "IDH"), puis 6 onglets :
  "⚔️ Histoire", "🏛 Politique", "💰 Economie", "👥 Societe", "🌱 Enviro", "⭐ Importance"
  (chacun avec ses sous-sections : Independance, Evenements majeurs, Regime, Chef de l'Etat,
  Ressources, Secteurs, IDH, Education, Atouts, Fragilites...). Format simplifie pour certains pays
  (Dependances critiques / Vulnerabilites / Roles mondiaux / Tensions actives) et message
  "Fiche detaillee en cours de redaction." quand aucune donnee.
- Legendes ("LEGENDE") et fiches contextuelles selon la couche (ressources, detroits maritimes
  avec "Enjeu geopolitique" et "⚡ Risques & tensions"). Pas de recherche textuelle.
- Donnees : `fetch /json/atlas/*.json` (capitales, fiches_pays 1-6, layer_colors, ressources[+meta],
  centroids, climat[+colors], routes_maritimes, detroits).
- Retour : "← Accueil" -> `accueil.html`.

### 3.5 Arts & Culture - module (`arts.html`)

- En-tete : sur-titre "Modules interactifs", h1 "Arts & Culture",
  tagline "Peinture, Litterature, Musique, Cinema - oeuvres, artistes & anecdotes".
- **Galerie** (grille de cartes) organisee par discipline et par epoque, pas une simple frise.
- Filtre par discipline (libelle "Filtrer par discipline", chips) : "✦ Tout", "🖼️ Peinture",
  "📚 Litterature", "🎬 Cinema", "🎵 Musique", "🏛️ Architecture & Arts". Selectionner une discipline
  reconstruit la barre d'onglets d'epoques propre a cette discipline (ex. Peinture : "Renaissance"
  vers 1400-1600, "Baroque", "Neoclassicisme", "Romantisme", "Impressionnisme", "Post-Impressionnisme",
  "Art Nouveau / Symbolisme", "Modernisme"; Musique, Litterature, Cinema, Architecture ont chacune
  leurs propres epoques). Chaque onglet affiche le nom d'epoque + une plage de dates en italique.
- Clic sur une carte -> modale : image (ou degrade colore si absente), supra-titre (discipline),
  titre dore, meta (auteur, date, mouvement), description, section "✦ Anecdotes & curiosites",
  section "✦ Quiz" (question + indice + reponse a reveler).
- Donnees : `fetch json/arts/arts-data.json` (tableau d'epoques contenant des `events` avec
  discipline, mouvement, year, desc, anecdotes, quiz, img).
- Retour : "← Portail des savoirs" -> `accueil.html` (libelle de retour different des autres pages).

### 3.6 Logique & Raisonnement - module (`logique.html`)

- En-tete : h1 "Logique & Raisonnement", tagline "5 chapitres · 25 exercices progressifs · Correction etape par etape".
- Ecran d'entree : barre de score global ("Score total", "Reussies", "Taux reussite") + rangee de
  boutons de chapitres. 5 chapitres x 5 exercices :
  1. "Suites & Sequences" (🔢)
  2. "Deduction & Syllogismes" (🧠)
  3. "Probabilites" (🎲)
  4. "Calcul Mental Rapide" (⚡)
  5. "Enigmes & Paradoxes" (🔮)
- Flux d'exercice : en-tete chapitre + compteur "Exercice X / 5" + pastille de difficulte
  (Facile/Moyen/Difficile) + barre de progression. Carte d'exercice : enonce, zone de reponse
  (type "choix" = 4 boutons, ou type "saisie" = champ + bouton "Valider"), bouton
  "💡 Afficher un indice", zone de correction. Navigation : "← Precedent", "Voir la correction", "Suivant →".
- Apres reponse : correction avec "✅"/"❌", titre "Bonne reponse !" / "Pas tout a fait...",
  "Reponse : ...", et etapes numerotees revelees progressivement.
- Fin de chapitre : "⚡", titre "Chapitre termine ! X/5 bonnes reponses", boutons "↩ Recommencer" /
  "Chapitre suivant →". Suivi du score global et par chapitre (badge "X/5 · Y ✓").
- Donnees : objet JS `CHAPITRES` inline.
- Retour : "← Accueil" -> `accueil.html`.

### 3.7 Mathematiques - module (`mathematiques_module.html`)

- En-tete : h1 "Mathematiques", tagline "Histoire des decouvertes · Demonstrations visuelles · Anecdotes & enigmes".
- 3 onglets : "📅 Frise des decouvertes", "🔍 Demonstrations", "💡 Anecdotes & Enigmes".
  1. Frise : ~11 jalons alternes gauche/droite (os d'Ishango, corde egyptienne, Thales, Pythagore,
     Eratosthene, Al-Khwarizmi, Fibonacci, Descartes, Euler, Gauss, maths du XXe siecle), chaque carte
     avec periode, titre, description, anecdote.
  2. Demonstrations : 6 cartes SVG animees (theoreme de Pythagore avec bouton "▶ Rejouer l'animation",
     division par zero, somme des angles = 180°, nombre d'or φ, √2 irrationnel, infinis de Cantor),
     avec etapes d'explication numerotees.
  3. Anecdotes & Enigmes : 6 cartes (Eratosthene, corde 3-4-5, Gauss, Zenon, Euler/Konigsberg,
     Hilbert) avec encart enigme ("🤔 A vous de jouer" / "💡 Le saviez-vous ?") et bouton
     "▶ Voir la reponse".
- Donnees : entierement en HTML/SVG inline (pas de JSON externe).
- Retour : "← Accueil" -> `accueil.html`.

### 3.8 Sciences & Nature - module (`sciences_module.html`)

- En-tete : h1 "Sciences & Nature", tagline "Histoire des decouvertes · Experiences emblematiques · Anecdotes & enigmes".
- 3 onglets : "📅 Frise des decouvertes", "🔬 Experiences cles", "💡 Anecdotes & Enigmes".
  1. Frise : ~12 jalons (Aristote, Archimede, Copernic, Galilee, Harvey, Newton, Lavoisier, Darwin,
     Mendel, revolution quantique 1895-1905, Watson & Crick 1953, science du XXIe siecle).
  2. Experiences cles : 6 SVG (poussee d'Archimede, chute des corps Galilee/Aristote, experience de
     Pasteur, photosynthese, double helice ADN, E=mc²) avec etapes d'explication.
  3. Anecdotes & Enigmes : 6 cartes (Archimede, Newton, Fleming/penicilline, Marie Curie, cuisson
     d'un oeuf, Hubble) avec enigme et "▶ Voir la reponse".
- Donnees : HTML/SVG inline.
- Retour : "← Accueil" -> `accueil.html`.

---

## 4. Elements transverses d'UI

- **En-tete de page** : sur-titre en petites capitales dorees (`.over-title`, Cinzel, letter-spacing
  fort, UPPERCASE), h1 en degrade dore, tagline en italique, decor `.header-deco` (filets + symbole).
- **Lien retour** : fixe en haut a gauche, Cinzel UPPERCASE, dore au survol.
  - Pages d'activites/modules : "← Accueil" -> `accueil.html` (sauf `arts.html` : "← Portail des savoirs").
  - Decks de flashcards : "← Flashcards" -> `flashcards/index.html` (Genius : `index.html`).
- **Pied de page** : filet superieur + ligne en petites capitales tres attenuees, ex.
  "L'Encyclopedie des Explorateurs · Culture generale interactive".
- **Badges "Disponible"** : pilule Cinzel UPPERCASE doree. Etat "a venir" prevu (badge grise
  `coming-badge` / classe `.coming`, opacite reduite, fleche masquee) mais inutilise sur l'accueil.
  Dans l'atlas, les couches non pretes affichent "— A venir —".
- **Encarts de stats** : barre `.stats-bar` (chiffre dore en Cinzel + label en petites capitales),
  utilisee sur le hub flashcards et l'entree quiz.
- **Codes visuels recurrents** : libelles de section et labels en petites capitales/letter-spacing
  (`.section-label`, `.over-title`, tags), cartes a bordure doree subtile, hover par
  `border-color` + `box-shadow` (pas de translate/scale), apparition des cartes a l'`IntersectionObserver`,
  emojis comme icones, degrade dore sur les grands titres.
- **Animation de flip** standardisee sur toutes les flashcards (perspective 1200px, cubic-bezier
  elastique .6s, double requestAnimationFrame, overlay 180ms, iris 0.4s).

---

## 5. Ecarts entre le legacy et l'etat actuel de genius-v2

Etat observe de la reconstruction (`src/`) au moment de l'audit :

- **Une seule brique** existe : `quiz` (`src/bricks/quiz/`), consommant le `contentKind` "qcm".
- **Contenu present** : 2 packs seulement, tous deux en histoire : "Préhistoire" et "Antiquite"
  (`src/content/histoire/*.json`). Aucune geo, maths, sciences, arts, logique.
- **Accueil reconstruit** (`Hub` dans `src/app/shell.tsx`) : il liste les **packs de CONTENT**
  (un par sujet/titre) sous une unique section "Entrainement", chaque carte renvoyant vers la brique
  capable de jouer le pack. Il n'y a PAS la structure a deux sections de l'accueil legacy
  ("Entrainement" Flashcards+Quiz / "Modules interactifs" x6).

Ecarts notables de navigation (ce qui, aujourd'hui, ne correspond PAS au legacy) :

1. **Sections d'accueil** : le legacy a 2 grandes activites d'entrainement (Flashcards, Quiz) PUIS
   6 modules interactifs (Chronologie, Atlas, Arts, Logique, Maths, Sciences). La version actuelle
   n'expose qu'une liste de packs QCM. Manquent : Flashcards, Chronologie, Atlas, Arts (module),
   Logique (module), Mathematiques (module), Sciences (module).
2. **Flashcards absentes** : tout le hub flashcards (6 themes + Mode Genius), le flip recto/verso,
   les filtres (epoque, niveau, categorie) et l'auto-evaluation (Je sais / A revoir) ne sont pas
   reconstruits.
3. **Quiz reduit** : la brique quiz actuelle joue un pack QCM par sujet/theme. Le legacy propose 3
   MODES (Questions, Dates, Images) avec tirage aleatoire tous sujets confondus, pastilles de
   progression, ecran de recompense (trophees/etoiles), modale d'abandon, navigation clavier
   A/B/C/D. Ces elements restent a porter ou a re-specifier.
4. **Modules de savoir non reconstruits** : Chronologie (frise + 6 branches JSON + modale anecdotes),
   Atlas (carte SVG, 5 categories de couches, fiches pays a 6 onglets), Arts (galerie discipline x
   epoque), et les modules Maths/Sciences (frise + demos/experiences SVG + anecdotes) et Logique
   (5 chapitres x 5 exercices) n'ont aucune brique equivalente.
5. **Donnees** : le riche corpus de `legacy/json/` (chronologie, atlas, arts) et les ~370 images
   `.webp` ne sont pas encore migres en packs valides Zod du nouveau modele.
6. **Libelles/identite** : l'accueil legacy a une tagline et des descriptions precises par carte ;
   la version actuelle affiche des libelles generiques (sujet + titre de pack). Le titre est ecrit
   "L'Encyclopedie des Explorateurs" sans accents dans le code reconstruit (`shell.tsx`), conforme
   a la convention de redaction du nouveau projet mais a verifier vis-a-vis de l'UI souhaitee.
7. **Incoherence de comptage heritee** : les compteurs de cartes du hub flashcards legacy
   (109/155/100/155/30/30) divergent du contenu reel des decks ; a corriger plutot qu'a reproduire.

> Conclusion : la reconstruction couvre aujourd'hui ~1 des 8 entrees de l'accueil legacy (le quiz,
> partiellement) avec seulement 2 sujets d'histoire. La cible fonctionnelle complete = 1 hub a 2
> sections + 2 activites (Flashcards, Quiz multi-mode) + 6 modules de savoir, alimentes par les
> packs JSON de `legacy/json/` et les images de `legacy/img/`.
