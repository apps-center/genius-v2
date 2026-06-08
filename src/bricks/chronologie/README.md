# Brique `chronologie` (frise historique)

Frise verticale interactive : des periodes, des evenements dates avec icone, tag,
date, titre, description, image et anecdotes depliables. Conforme au contrat de brique
(`manifest` / `mount` / `unmount`) et a la presentation decrite dans
`docs/audit-legacy.md` (section 3.3).

## Frontiere

`brick.tsx` expose EXACTEMENT `manifest`, `mount(container, ctx)`, `unmount()`.
La brique ne connait que `ctx`. Elle lit le pack a jouer dans l'URL
(`?sujet=...&titre=...`), exactement comme la brique quiz : elle fonctionne donc seule
(dev) comme dans le shell.

- `contentKind` consomme : `chronologie`.
- `logic/frise.ts` : mecanique PURE (regroupement par periode, separation des entetes
  de section, numerotation continue, alternance gauche/droite du zigzag). Zero React,
  testee par vitest (`logic/frise.test.ts`).
- `ui/` : rendu seul, en CSS Modules (`Frise.module.css`), couleurs issues de
  `tokens.css` uniquement.

## Evenements de domaine

- `activity.start` a l'ouverture de la frise.
- `timeline.viewed` la premiere fois que les anecdotes d'un evenement sont depliees.

La brique ne sait rien des consommateurs (gamification, telemetrie).

## Contenu

Un pack = une branche de la chronologie. Forme validee par Zod
(`src/core/content/chronologie.schema.ts`) :

```
{ contentKind: 'chronologie', sujet, titre, periodes: [
    { era, cls?, events: [ { title, date, desc, tag?, icon?, kind?, img?, anecdotes:[{t,e?}] } ] }
] }
```

Une periode dont `events` est vide est un ENTETE de section (ex. "HAUTE ANTIQUITE").
Le texte des descriptions et des anecdotes peut contenir un peu de HTML de mise en
forme (`<b>`, `&nbsp;`) present dans le contenu d'origine ; il est statique, embarque au
build et valide par Zod, donc rendu tel quel.

Branche pilote migree : **Antiquite** (`src/content/chronologie/antiquite.json`),
10 periodes, 63 evenements. Les 5 autres branches (prehistoire, moyenage, tempsmodernes,
contemporaine, monde) seront migrees dans une passe separee, avec le meme outil.

## Strategie d'images

Les frises referencent des images `.webp` du dossier `legacy/img/`. Strategie retenue :

1. **Copie selective** : seules les images REELLEMENT referencees par la branche migree
   sont copiees (63 pour Antiquite), pas tout le dossier `legacy/img/histoire`.
2. **Slugification** : les noms d'origine contiennent espaces, accents et apostrophes
   (URLs fragiles). Chaque image est renommee en slug ascii (minuscules, tirets) lors de
   la copie, ce qui donne des URLs robustes sans encodage.
3. **Service statique** : les images sont copiees dans `public/img/chronologie/` et donc
   servies a la racine par Vite en production. Le champ `img` du pack est reecrit en URL
   racine `"/img/chronologie/<slug>.webp"`. La brique fait juste `<img src={event.img}>`.

Le tout est reproductible via :

```
node scripts/migrer-chronologie.mjs antiquite
```

Ce script lit le JSON legacy, convertit les tirets cadratin/demi-cadratin en tiret
simple, copie + slugifie les images, et ecrit le pack dans `src/content/chronologie/`.
Relancer le script avec une autre branche suffira pour la passe suivante.

## Ajouter une branche (passe ulterieure)

1. `node scripts/migrer-chronologie.mjs <branche>` (genere le pack + copie ses images).
2. Ajouter 1 ligne dans `CONTENT` (registre) pointant le nouveau `.json`.
3. La validation Zod et la suite de tests prennent la branche en charge automatiquement.
