import { z } from 'zod';

/*
  Schema Zod du contentKind 'chronologie' (la frise). Securise chaque pack AVANT usage.
  Calque sur la structure reelle de legacy/json/chronologie/*.json :
   - un pack = une branche (ex. Antiquite) : un tableau de PERIODES,
   - une periode = { era, cls?, events[] }. Une periode dont `events` est vide est un
     ENTETE de section (ex. "⬛ HAUTE ANTIQUITE") ; sinon c'est une sous-periode datee.
   - un evenement = { title, date, desc, tag?, icon?, kind?, img?, anecdotes[] }.
   - une anecdote = { t (texte, HTML simple autorise : <b>), e? (emoji) }.

  logic/ et ui/ ne connaissent QUE la forme typee deduite ici, jamais un fichier precis.
*/

export const Anecdote = z.object({
  // Texte de l'anecdote. Peut contenir du HTML simple de mise en forme (<b>, &nbsp;)
  // present dans le contenu d'origine ; il est rendu tel quel (contenu statique de confiance).
  t: z.string().min(1),
  e: z.string().optional(), // emoji d'illustration
});

export const ChronoEvent = z.object({
  title: z.string().min(1),
  date: z.string().min(1),
  desc: z.string().min(1),
  tag: z.string().optional(),
  icon: z.string().optional(),
  // Categorie de la pastille (l'ancien champ legacy) : histoire / science / art / ...
  kind: z.string().optional(),
  // URL racine de l'image (ex. "/img/chronologie/xxx.webp"), deja copiee dans public/.
  img: z.string().optional(),
  anecdotes: z.array(Anecdote).default([]),
});

export const ChronoPeriode = z.object({
  era: z.string().min(1),
  cls: z.string().optional(),
  // Vide = entete de section ; non vide = sous-periode datee avec ses evenements.
  events: z.array(ChronoEvent).default([]),
});

export const ChronologiePack = z.object({
  contentKind: z.literal('chronologie'),
  sujet: z.string().min(1),
  titre: z.string().min(1),
  periodes: z.array(ChronoPeriode).min(1),
});

export type Anecdote = z.infer<typeof Anecdote>;
export type ChronoEvent = z.infer<typeof ChronoEvent>;
export type ChronoPeriode = z.infer<typeof ChronoPeriode>;
export type ChronologiePack = z.infer<typeof ChronologiePack>;
