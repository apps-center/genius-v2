/*
  Migration du module Atlas geopolitique legacy vers UN pack de CONTENU Genius.

  Usage : node scripts/migrer-atlas.mjs

  Particularite : contrairement au quiz / aux flashcards / a la chronologie (un sujet
  = un fichier), l'atlas est UN module unique. Son contenu est dissemine dans le legacy :
   - la geometrie de la carte est inline dans le HTML (const WORLD, ~195 traces SVG) ;
   - les donnees thematiques sont dans legacy/json/atlas/*.json (palettes, climat,
     ressources, routes maritimes, detroits, fiches pays, capitales, centroides).

  Ce script, de facon REPRODUCTIBLE :
   1. Extrait `const WORLD` du HTML et le parse (geometrie des pays).
   2. Recalcule la couleur de base "Monde" de chaque pays (logique baseFill du legacy)
      et la fige dans `baseColor` : la brique reste generique (zero logique de region).
   3. Lit et fusionne les fiches_pays*.json + les fichiers de couches reellement
      implementees dans v1 (parite legacy reel : geo + economie).
   4. Normalise tout tiret cadratin (—) / demi-cadratin (–) / signe moins (−) en
      tiret simple (-) dans tout le texte, conformement a la convention du projet.
   5. Assemble un pack { contentKind:'atlas', sujet, titre, viewBox, pays, capitales,
      centroids, fiches, couches, navConfig } valide ensuite par Zod au chargement.
      Pas d'image a copier : l'atlas n'utilise que des emojis.
*/
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const RACINE = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const lireJson = (rel) => JSON.parse(readFileSync(resolve(RACINE, rel), 'utf8'));

// --- 1. Extraction de const WORLD depuis le HTML legacy ---
const html = readFileSync(resolve(RACINE, 'legacy/atlas_geopolitique.html'), 'utf8');
function extraireTableau(src, nom) {
  const ancre = src.indexOf(`const ${nom}`);
  if (ancre < 0) throw new Error(`"${nom}" introuvable dans le HTML`);
  const debut = src.indexOf('[', ancre);
  // Scan a equilibrage de crochets, en ignorant le contenu des chaines "..."
  let profondeur = 0;
  let dansChaine = false;
  for (let i = debut; i < src.length; i++) {
    const ch = src[i];
    if (dansChaine) {
      if (ch === '\\') i++;
      else if (ch === '"') dansChaine = false;
      continue;
    }
    if (ch === '"') dansChaine = true;
    else if (ch === '[') profondeur++;
    else if (ch === ']' && --profondeur === 0) return JSON.parse(src.slice(debut, i + 1));
  }
  throw new Error(`Crochet fermant de "${nom}" introuvable`);
}
const WORLD = extraireTableau(html, 'WORLD');

// --- 2. Couleur de base "Monde" (logique baseFill du legacy, figee a la migration) ---
const CONT_FILL = {
  Europe: '#4e7fba',
  Asia: '#5a9070',
  'North America': '#4d9068',
  'South America': '#3a9880',
  Africa: '#b07030',
  Oceania: '#3a8898',
  'Seven seas (open ocean)': '#0f1e38',
};
const ME = ['AE', 'BH', 'IQ', 'IR', 'IL', 'JO', 'KW', 'LB', 'OM', 'PS', 'QA', 'SA', 'SY', 'YE'];
const NAM = ['CA', 'GL', 'US'];
const CAM = ['BZ', 'CR', 'CU', 'DO', 'GT', 'HN', 'HT', 'JM', 'MX', 'NI', 'PA', 'PR', 'SV', 'TT'];
const SAM = ['AR', 'BO', 'BR', 'CL', 'CO', 'EC', 'GY', 'PE', 'PY', 'SR', 'UY', 'VE'];
function baseFill(cont, id) {
  if (ME.includes(id)) return '#c4a052';
  if (NAM.includes(id)) return '#4d9068';
  if (CAM.includes(id)) return '#3fa878';
  if (SAM.includes(id)) return '#3a9880';
  return CONT_FILL[cont] || '#2a3a55';
}

// --- 3. Lecture des donnees thematiques (parite legacy reel) ---
const fiches = {};
for (const n of ['', '_2', '_3', '_4', '_5', '_6']) {
  Object.assign(fiches, lireJson(`legacy/json/atlas/fiches_pays${n}.json`));
}
const capitales = lireJson('legacy/json/atlas/capitales.json');
const centroids = lireJson('legacy/json/atlas/centroids.json');
const layerColors = lireJson('legacy/json/atlas/layer_colors.json');
const climatData = lireJson('legacy/json/atlas/climat.json');
const climatZones = lireJson('legacy/json/atlas/climat_colors.json');
const ressourcesData = lireJson('legacy/json/atlas/ressources.json');
const ressourcesMeta = lireJson('legacy/json/atlas/ressources_meta.json');
const routes = lireJson('legacy/json/atlas/routes_maritimes.json');
const detroits = lireJson('legacy/json/atlas/detroits.json');

// Replis continentaux des couches choropleth (codes en dur dans setLayer du legacy ;
// les cles `_X_default` du JSON layer_colors n'etaient jamais lues). On les fige ici.
const CONT_DEFAUTS = {
  water: { Europe: '#489848', Asia: '#887048', 'North America': '#509848', 'South America': '#489848', Africa: '#906040', Oceania: '#a07848' },
  demo: { Europe: '#3068a8', Asia: '#608888', 'North America': '#608868', 'South America': '#608880', Africa: '#a04848', Oceania: '#608868' },
  energy: { Europe: '#b82828', Asia: '#907838', 'North America': '#608828', 'South America': '#589828', Africa: '#509028', Oceania: '#609028' },
};
// Etiquettes + legendes des couches choropleth (reprises de setLayer du legacy).
const COLORS_META = {
  water: {
    label: 'Stress hydrique',
    legendeTitre: 'Stress Hydrique',
    source: 'WRI Aqueduct 2023',
    legende: [
      { couleur: '#be2a10', label: 'Critique' },
      { couleur: '#a86838', label: 'Élevé' },
      { couleur: '#6a9848', label: 'Modéré' },
      { couleur: '#289848', label: 'Faible' },
    ],
  },
  demo: {
    label: 'Croissance démographique',
    legendeTitre: 'Démographie',
    source: 'ONU DESA 2024',
    legende: [
      { couleur: '#c81818', label: 'Forte croissance' },
      { couleur: '#608880', label: 'Transition' },
      { couleur: '#1858be', label: 'Vieillissement' },
    ],
  },
  energy: {
    label: 'Dépendance énergétique',
    legendeTitre: 'Énergie',
    source: 'AIE 2023',
    legende: [
      { couleur: '#289828', label: 'Exportateur' },
      { couleur: '#908838', label: 'Équilibré' },
      { couleur: '#c01818', label: 'Très dépendant' },
    ],
  },
};

// Couleurs des couches choropleth : on retire les cles internes `_X_default`
// (jamais utilisees pour le rendu) et on ne garde que les codes pays.
function paysSeulement(table) {
  const out = {};
  for (const [iso, col] of Object.entries(table)) {
    if (!iso.startsWith('_')) out[iso] = col;
  }
  return out;
}

// Groupes de ressources (filtres de setLayer du legacy).
const GROUPES_RESSOURCES = {
  'energy-res': {
    label: 'Ressources Énergétiques',
    types: ['oil', 'gas', 'coal', 'uranium', 'solar'],
  },
  minerais: {
    label: 'Minerais & Matières premières',
    types: ['iron', 'copper', 'bauxite', 'gold', 'lithium', 'cobalt', 'nickel', 'phosphate', 'rare', 'diamond', 'wood', 'salt'],
  },
};

// --- Reclassement de la couche EAU sur WRI Aqueduct 2023 ---
// Les donnees d'origine confondaient aridite/secheresse et stress hydrique de base
// (ratio prelevements/ressources) : l'Afrique subsaharienne etait sur-stressee via un
// repli continental "eleve", l'Inde/le Chili/la Grece etaient sous-evalues, et le niveau
// "modere" n'etait jamais utilise. On remplace par une classification curee a 4 niveaux,
// approximation pedagogique du classement WRI Aqueduct 2023 (baseline water stress).
// Tout pays non liste est "faible" par defaut (neutre), continents inclus.
const EAU_WRI = {
  critique: [
    // Moyen-Orient et Afrique du Nord
    'SA', 'AE', 'QA', 'KW', 'OM', 'YE', 'IL', 'JO', 'LB', 'SY', 'IQ', 'IR',
    'EG', 'LY', 'TN', 'MA', 'DZ', 'CY', 'CY_2',
    // Asie du Sud et centrale
    'IN', 'PK', 'AF', 'TM', 'UZ',
    // Reste (figurent au top mondial WRI 2023)
    'CL', 'GR', 'BE', 'BW', 'NA', 'ZA',
  ],
  eleve: [
    'ES', 'PT', 'IT', 'TR', 'DJ', 'ER', 'SO', 'SO_', 'SD', 'MR', 'EH',
    'AZ', 'AM', 'GE', 'KZ', 'KG', 'TJ', 'CN', 'KR', 'MX', 'AU', 'MN', 'LK',
  ],
  modere: [
    'US', 'FR', 'DE', 'PL', 'RO', 'UA', 'BG', 'RS', 'HU', 'SK',
    'NG', 'GH', 'SN', 'KE', 'ET', 'TD', 'ML', 'NE', 'MZ', 'TZ', 'UG', 'ZW', 'BF', 'SS',
    'TH', 'VN', 'PH', 'JP', 'NP', 'KH', 'MM', 'BD',
  ],
};
// Couleurs canoniques de la legende (les 4 niveaux apparaissent desormais sur la carte).
const EAU_COULEURS = { critique: '#be2a10', eleve: '#a86838', modere: '#6a9848', faible: '#289848' };
function construireCoucheEau() {
  const pays = {};
  for (const [niveau, codes] of Object.entries(EAU_WRI)) {
    for (const iso of codes) pays[iso] = EAU_COULEURS[niveau];
  }
  // Repli neutre : tout pays non classe est "faible" (au lieu du brun "eleve" d'origine).
  const faible = EAU_COULEURS.faible;
  const continentDefaut = {
    Europe: faible, Asia: faible, 'North America': faible,
    'South America': faible, Africa: faible, Oceania: faible,
  };
  return { ...COLORS_META.water, pays, continentDefaut };
}

// --- Reclassement de la couche POPULATION (croissance demographique) ---
// Approximation pedagogique des tendances ONU DESA 2024 (3 niveaux) :
//  - forte croissance : forte fecondite, population en hausse rapide (Afrique sub-
//    saharienne surtout, plus Afghanistan, Pakistan, Yemen, Irak...) ;
//  - transition : fecondite proche du seuil de remplacement, croissance ralentie
//    (Amerique latine, Asie du Sud et du Sud-Est, Maghreb, Amerique du Nord...) ;
//  - vieillissement : fecondite sous le seuil, population qui plafonne ou decline
//    (Europe, Russie, Japon, Coree, Chine depuis 2023, Thailande...).
// Replis continentaux : Afrique = forte croissance, Europe = vieillissement, le reste
// = transition. Les exceptions notables sont listees explicitement.
const DEMO_COULEURS = { forte: '#c81818', transition: '#608880', vieillissement: '#1858be' };
const DEMO_ONU = {
  // Hors Afrique (qui est deja "forte" par defaut) : pays a forte croissance.
  forte: ['AF', 'PK', 'YE', 'IQ', 'PS', 'TL', 'PG'],
  // Vieillissement hors Europe (Europe = vieillissement par defaut).
  vieillissement: ['CN', 'JP', 'KR', 'TW', 'TH', 'SG', 'CU'],
  // Transition : exceptions africaines (transition demographique avancee) + Maghreb.
  transition: ['ZA', 'BW', 'NA', 'LS', 'SZ', 'MA', 'DZ', 'TN', 'LY', 'EG'],
};
function construireCoucheDemo() {
  const pays = {};
  for (const [niveau, codes] of Object.entries(DEMO_ONU)) {
    for (const iso of codes) pays[iso] = DEMO_COULEURS[niveau];
  }
  const continentDefaut = {
    Africa: DEMO_COULEURS.forte,
    Europe: DEMO_COULEURS.vieillissement,
    Asia: DEMO_COULEURS.transition,
    'North America': DEMO_COULEURS.transition,
    'South America': DEMO_COULEURS.transition,
    Oceania: DEMO_COULEURS.transition,
  };
  return { ...COLORS_META.demo, pays, continentDefaut };
}

// Navigation des couches : structure NAV_CONFIG du legacy + le type de rendu de chacune.
const NAV_CONFIG = [
  {
    id: 'geo',
    label: 'Géographie',
    emoji: '🌍',
    layers: [
      { id: 'world', label: 'Monde', emoji: '🌍', type: 'base' },
      { id: 'demo', label: 'Population', emoji: '👥', type: 'colors' },
      { id: 'water', label: 'Eau', emoji: '💧', type: 'colors' },
      { id: 'climat', label: 'Climat', emoji: '🌡', type: 'climat' },
    ],
  },
  {
    id: 'economie',
    label: 'Économie',
    emoji: '💰',
    layers: [
      { id: 'energy', label: 'PIB & Énergie', emoji: '⚡', type: 'colors' },
      { id: 'energy-res', label: 'Fossiles & Nucl.', emoji: '🛢', type: 'ressources' },
      { id: 'minerais', label: 'Minerais', emoji: '⛏', type: 'ressources' },
      { id: 'maritime', label: 'Routes maritimes', emoji: '🚢', type: 'maritime' },
    ],
  },
];

// --- 4. Normalisation des tirets sur tout le texte du pack ---
const sansCadratin = (s) => s.replace(/[—–−]/g, '-');
function normaliser(valeur) {
  if (typeof valeur === 'string') return sansCadratin(valeur);
  if (Array.isArray(valeur)) return valeur.map(normaliser);
  if (valeur && typeof valeur === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(valeur)) out[k] = normaliser(v);
    return out;
  }
  return valeur;
}

// --- 5. Assemblage du pack ---
const pays = WORLD.map((c) => ({
  id: c.id,
  iso3: c.iso3,
  name: c.name,
  cont: c.cont,
  d: c.d,
  baseColor: baseFill(c.cont, c.id),
}));

const couchesColors = {};
for (const id of ['demo', 'water', 'energy']) {
  if (id === 'water') {
    // Couche eau : classification curee (WRI Aqueduct 2023), pas les donnees d'origine.
    couchesColors.water = construireCoucheEau();
    continue;
  }
  if (id === 'demo') {
    // Couche population : classification curee (tendances ONU DESA 2024).
    couchesColors.demo = construireCoucheDemo();
    continue;
  }
  if (!layerColors[id]) continue;
  couchesColors[id] = {
    ...COLORS_META[id],
    pays: paysSeulement(layerColors[id]),
    continentDefaut: CONT_DEFAUTS[id] ?? {},
  };
}

const pack = normaliser({
  contentKind: 'atlas',
  sujet: 'geographie',
  titre: 'Monde',
  viewBox: '0 0 1200 600',
  pays,
  capitales,
  centroids,
  fiches,
  couches: {
    colors: couchesColors,
    climat: { label: 'Zones climatiques', data: climatData, zones: climatZones },
    ressources: { meta: ressourcesMeta, data: ressourcesData, groupes: GROUPES_RESSOURCES },
    maritime: {
      label: 'Routes & Détroits maritimes',
      routes,
      detroits,
      niveauCouleurs: { critical: '#e83030', high: '#e87830', medium: '#e8c030' },
    },
  },
  navConfig: NAV_CONFIG,
});

const dossier = resolve(RACINE, 'src/content/atlas');
mkdirSync(dossier, { recursive: true });
const sortie = resolve(dossier, 'monde.json');
writeFileSync(sortie, JSON.stringify(pack, null, 2) + '\n', 'utf8');

console.log('Atlas -> Monde');
console.log(`  pays (traces SVG) : ${pack.pays.length}`);
console.log(`  fiches pays : ${Object.keys(pack.fiches).length}`);
console.log(`  capitales : ${Object.keys(pack.capitales).length}`);
console.log(`  couches choropleth : ${Object.keys(couchesColors).join(', ')}`);
console.log(`  routes maritimes : ${routes.length} | detroits : ${detroits.length}`);
console.log(`  zones climat : ${Object.keys(climatZones).length} | types ressources : ${Object.keys(ressourcesMeta).length}`);
console.log(`  ecrit : ${sortie}`);
