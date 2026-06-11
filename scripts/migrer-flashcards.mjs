/*
  Migration d'un deck de flashcards legacy vers un pack de CONTENU Genius.

  Usage : node scripts/migrer-flashcards.mjs <deck>
          (deck = "arts" | "logique")

  Ce que fait le script, de facon REPRODUCTIBLE (les autres decks passeront par le
  meme outil dans une passe ulterieure) :
   1. Lit le tableau de cartes inline du HTML legacy (const CARDS / const ALL_CARDS).
   2. Convertit tout tiret cadratin (—) / demi-cadratin (–) / signe moins (−) en
      tiret simple (-), conformement a la convention de redaction du projet.
   3. Modele IMAGE : pour chaque image .webp reellement referencee, slugifie le nom
      (ascii, sans espace ni accent ni apostrophe), copie le fichier depuis legacy/img/
      vers public/img/flashcards/<deck>/, et reecrit le champ `image` en URL racine
      "/img/flashcards/<deck>/<slug>.webp". L'image est servie SANS rognage cote rendu.
   4. Enveloppe les cartes dans un pack { contentKind:'flashcards', sujet, titre, cartes }
      avec le champ discriminant `type` ('image' | 'qr'), et l'ecrit dans
      src/content/flashcards/<deck>.json (valide ensuite par Zod et par la suite de tests).
*/
import { readFileSync, writeFileSync, copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const RACINE = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// Config par deck : source HTML, marqueur du tableau, sujet/titre du pack, modele.
const DECKS = {
  arts: {
    html: 'legacy/flashcards/art.html',
    marqueur: 'const CARDS =',
    sujet: 'arts',
    titre: 'Arts',
    modele: 'image',
    imgSrc: 'legacy/img/arts',
  },
  logique: {
    html: 'legacy/flashcards/logique.html',
    marqueur: 'const ALL_CARDS =',
    sujet: 'logique',
    titre: 'Logique',
    modele: 'qr',
  },
  geographie: {
    html: 'legacy/flashcards/geographie.html',
    marqueur: 'const ALL_CARDS =',
    sujet: 'geographie',
    titre: 'Géographie',
    modele: 'qr',
  },
};

function noDash(s) {
  return s.replace(/\s*[—–−]\s*/g, ' - ').replace(/[—–−]/g, '-');
}

function slugify(name) {
  const dot = name.lastIndexOf('.');
  const base = dot >= 0 ? name.slice(0, dot) : name;
  const ext = dot >= 0 ? name.slice(dot + 1).toLowerCase() : 'webp';
  const slug = base
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${slug}.${ext}`;
}

// Extrait le tableau JS inline en cherchant le crochet fermant equilibre.
// Certains decks qr (geographie, sciences) referencent dans leurs cartes des IDENTIFIANTS
// d'illustration definis ailleurs dans le HTML legacy : SVG.xxx (dictionnaire de visuels)
// et une palette C. Evaluer le seul tableau, hors contexte, levait "SVG is not defined".
// On NE migre PAS les illustrations pour l'instant (le champ `illustration` du schema reste
// vide), donc on evalue le tableau dans un scope ou SVG et C sont des stubs NEUTRES : toute
// reference d'illustration s'evalue en `undefined` et n'alimente aucun champ du pack.
function extraireTableau(html, marqueur) {
  const start = html.indexOf(marqueur);
  if (start < 0) throw new Error(`marqueur introuvable : ${marqueur}`);
  const open = html.indexOf('[', start);
  let depth = 0;
  let inStr = false;
  for (let i = open; i < html.length; i++) {
    const c = html[i];
    if (inStr) {
      if (c === '\\') i++;
      else if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') inStr = true;
    else if (c === '[') depth++;
    else if (c === ']' && --depth === 0) {
      const src = html.slice(open, i + 1);
      const stub = new Proxy({}, { get: () => undefined });
      // eslint-disable-next-line no-new-func
      return Function('SVG', 'C', `return (${src});`)(stub, stub);
    }
  }
  throw new Error('tableau non termine');
}

const deck = process.argv[2];
const cfg = DECKS[deck];
if (!cfg) {
  console.error(`Deck inconnu : "${deck}". Choix : ${Object.keys(DECKS).join(', ')}.`);
  process.exit(1);
}

const html = readFileSync(join(RACINE, cfg.html), 'utf8');
const brut = extraireTableau(html, cfg.marqueur);

let cartes;
if (cfg.modele === 'image') {
  const dst = join(RACINE, 'public/img/flashcards', deck);
  mkdirSync(dst, { recursive: true });
  const slugs = new Map();
  cartes = brut.map((c) => {
    const slug = slugify(c.img);
    if (slugs.has(slug) && slugs.get(slug) !== c.img) {
      throw new Error(`collision de slug "${slug}" (${slugs.get(slug)} vs ${c.img})`);
    }
    slugs.set(slug, c.img);
    const src = join(RACINE, cfg.imgSrc, c.img);
    if (!existsSync(src)) throw new Error(`image source manquante : ${c.img}`);
    copyFileSync(src, join(dst, slug));
    return {
      type: 'image',
      id: `${deck}-${c.id}`,
      image: `/img/flashcards/${deck}/${slug}`,
      titre: noDash(c.title),
      date: noDash(c.date),
      epoque: noDash(c.era),
      description: noDash(c.desc),
    };
  });
} else {
  cartes = brut.map((c) => {
    const carte = {
      type: 'qr',
      id: `${deck}-${c.id}`,
      question: noDash(c.q),
      reponse: noDash(c.ans),
    };
    if (c.exp) carte.explication = noDash(c.exp);
    if (c.cat) carte.categorie = noDash(c.cat);
    if (typeof c.diff === 'number') carte.difficulte = c.diff;
    return carte;
  });
}

const pack = { contentKind: 'flashcards', sujet: cfg.sujet, titre: cfg.titre, cartes };

const texte = JSON.stringify(pack);
for (const ch of ['—', '–', '−']) {
  if (texte.includes(ch)) throw new Error('tiret long residuel dans la sortie');
}

const dstDir = join(RACINE, 'src/content/flashcards');
mkdirSync(dstDir, { recursive: true });
writeFileSync(join(dstDir, `${deck}.json`), JSON.stringify(pack, null, 2) + '\n');
console.log(`${deck} : ${cartes.length} cartes ecrites (modele ${cfg.modele}).`);
