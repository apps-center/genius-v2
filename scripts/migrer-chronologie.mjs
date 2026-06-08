/*
  Migration d'une branche de chronologie legacy vers un pack de CONTENU Genius.

  Usage : node scripts/migrer-chronologie.mjs <branche>
          (branche = nom de fichier sans extension, ex. "antiquite")

  Ce que fait le script, de facon REPRODUCTIBLE (les 5 autres branches passeront
  par le meme outil dans une passe ulterieure) :
   1. Lit legacy/json/chronologie/<branche>.json (tableau de periodes brut).
   2. Convertit tout tiret cadratin (—) / demi-cadratin (–) / signe moins (−) en
      tiret simple (-), conformement a la convention de redaction du projet.
   3. Pour chaque image .webp reellement referencee : slugifie le nom (ascii, sans
      espace ni accent ni apostrophe -> URL robuste), copie le fichier depuis
      legacy/img/ vers public/img/chronologie/, et reecrit le champ `img` en URL
      racine "/img/chronologie/<slug>.webp". SEULES les images de cette branche
      sont copiees (pas tout le dossier legacy/img/histoire).
   4. Enveloppe le tableau dans un pack { contentKind, sujet, titre, periodes } et
      l'ecrit dans src/content/chronologie/<branche>.json (valide ensuite par Zod
      au chargement et par la suite de tests).
*/
import { readFileSync, writeFileSync, copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const RACINE = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// Titre humain par branche (reutilise pour les passes suivantes).
const TITRES = {
  prehistoire: 'Préhistoire',
  antiquite: 'Antiquité',
  moyenage: 'Moyen Âge',
  tempsmodernes: 'Temps modernes',
  contemporaine: 'Époque contemporaine',
  monde: 'Histoire du monde',
};

const branche = process.argv[2];
if (!branche || !(branche in TITRES)) {
  console.error(`Branche inconnue : "${branche}". Attendu : ${Object.keys(TITRES).join(', ')}`);
  process.exit(1);
}

// 1. Lecture du tableau de periodes brut.
const source = resolve(RACINE, `legacy/json/chronologie/${branche}.json`);
const periodes = JSON.parse(readFileSync(source, 'utf8'));

// 2. Conversion des tirets longs / signe moins en tiret simple, partout.
const sansCadratin = (s) => s.replace(/[—–−]/g, '-');

// 3. Slug d'image : ascii, minuscules, tirets. URL robuste (ni espace ni accent).
const dejaVus = new Map(); // chemin legacy -> slug (deduplication + anti-collision)
const slugsPris = new Set();
function slugImage(legacyRel) {
  if (dejaVus.has(legacyRel)) return dejaVus.get(legacyRel);
  const base = legacyRel.replace(/^.*\//, '').replace(/\.webp$/i, '');
  let slug = base
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // retire les accents
    .replace(/['’]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  if (!slug) slug = 'image';
  let candidat = `${slug}.webp`;
  let n = 2;
  while (slugsPris.has(candidat)) candidat = `${slug}-${n++}.webp`;
  slugsPris.add(candidat);
  dejaVus.set(legacyRel, candidat);
  return candidat;
}

const dossierImg = resolve(RACINE, 'public/img/chronologie');
mkdirSync(dossierImg, { recursive: true });

let nbEvents = 0;
let nbImages = 0;
const manquantes = [];

const periodesConverties = periodes.map((p) => ({
  era: sansCadratin(p.era ?? ''),
  cls: p.cls,
  events: (p.events ?? []).map((e) => {
    nbEvents++;
    let img;
    if (e.img) {
      const sourceImg = resolve(RACINE, 'legacy/img', e.img);
      if (existsSync(sourceImg)) {
        const slug = slugImage(e.img);
        copyFileSync(sourceImg, resolve(dossierImg, slug));
        img = `/img/chronologie/${slug}`;
        nbImages++;
      } else {
        manquantes.push(e.img);
      }
    }
    return {
      title: sansCadratin(e.title ?? ''),
      date: sansCadratin(e.date ?? ''),
      tag: e.tag ? sansCadratin(e.tag) : undefined,
      icon: e.icon,
      desc: sansCadratin(e.desc ?? ''),
      kind: e.kind,
      img,
      anecdotes: (e.anecdotes ?? []).map((a) => ({
        t: sansCadratin(a.t ?? ''),
        e: a.e,
      })),
    };
  }),
}));

// 4. Enveloppe dans un pack et ecrit le fichier de contenu.
const pack = {
  contentKind: 'chronologie',
  sujet: 'histoire',
  titre: TITRES[branche],
  periodes: periodesConverties,
};

const dossierContenu = resolve(RACINE, 'src/content/chronologie');
mkdirSync(dossierContenu, { recursive: true });
const sortie = resolve(dossierContenu, `${branche}.json`);
writeFileSync(sortie, JSON.stringify(pack, null, 2) + '\n', 'utf8');

console.log(`Branche "${branche}" -> ${TITRES[branche]}`);
console.log(`  periodes : ${periodesConverties.length}`);
console.log(`  evenements : ${nbEvents}`);
console.log(`  images copiees : ${nbImages} vers public/img/chronologie/`);
if (manquantes.length) console.log(`  IMAGES MANQUANTES (${manquantes.length}) :`, manquantes);
console.log(`  ecrit : ${sortie}`);
