import type { ChronoPeriode, ChronoEvent } from '../../../core/content/chronologie.schema';

/*
  Mecanique PURE de la frise : regroupement par periode, separation des entetes de
  section, numerotation et alternance gauche/droite (le zigzag de la frise verticale).
  ZERO React, ZERO DOM. Testable seul (vitest). ui/ ne fait que rendre ce resultat.
*/

export type Cote = 'gauche' | 'droite';

// Un evenement enrichi pour l'affichage : sa position globale et sa colonne.
export interface EvenementFrise extends ChronoEvent {
  cle: string; // identifiant stable (React + cle d'evenement de domaine)
  numero: number; // position globale (1-based) dans la frise
  cote: Cote; // colonne alternee (gauche pour les impairs, droite pour les pairs)
}

// Une section de la frise : soit un entete de periode (era seule), soit une
// sous-periode datee portant ses evenements.
export type SectionFrise =
  | { type: 'entete'; era: string; cls?: string }
  | { type: 'periode'; era: string; cls?: string; evenements: EvenementFrise[] };

// Une periode sans evenement est un ENTETE de section (ex. "⬛ HAUTE ANTIQUITE").
function estEntete(p: ChronoPeriode): boolean {
  return !p.events || p.events.length === 0;
}

export function construireFrise(periodes: ChronoPeriode[]): SectionFrise[] {
  let numero = 0; // compteur global, continu d'une periode a l'autre (zigzag stable)
  return periodes.map((p) => {
    if (estEntete(p)) {
      return { type: 'entete', era: p.era, cls: p.cls };
    }
    const evenements: EvenementFrise[] = p.events.map((e) => {
      numero += 1;
      return {
        ...e,
        cle: `${numero}:${e.title}`,
        numero,
        cote: numero % 2 === 1 ? 'gauche' : 'droite',
      };
    });
    return { type: 'periode', era: p.era, cls: p.cls, evenements };
  });
}

// Nombre total d'evenements dates (entetes exclus).
export function compterEvenements(periodes: ChronoPeriode[]): number {
  return periodes.reduce((t, p) => t + (p.events?.length ?? 0), 0);
}

// Nombre de sous-periodes datees (entetes de section exclus).
export function compterPeriodes(periodes: ChronoPeriode[]): number {
  return periodes.filter((p) => !estEntete(p)).length;
}
