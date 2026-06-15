/*
  Mecanique PURE du viewport de la carte : pan et zoom. ZERO React, ZERO DOM.
  Tout est exprime dans le repere du viewBox SVG (unites internes de la carte) :
  c'est l'appelant (la couche ui/) qui convertit les pixels ecran en coordonnees
  viewBox via la CTM du SVG. Ici on ne fait que de l'arithmetique testable.

  Le groupe de la carte porte la transformation `translate(vx,vy) scale(scale)`.
  Un point monde (wx,wy) apparait donc a l'ecran en (vx + wx*scale, vy + wy*scale).
*/

export interface Viewport {
  vx: number; // translation X (unites viewBox)
  vy: number; // translation Y (unites viewBox)
  scale: number; // facteur d'echelle
}

// Bornes de zoom reprises de l'ancien site (0.8x a 16x).
export const SCALE_MIN = 0.8;
export const SCALE_MAX = 16;

export const VIEWPORT_INITIAL: Viewport = { vx: 0, vy: 0, scale: 1 };

export function clampScale(scale: number): number {
  return Math.min(SCALE_MAX, Math.max(SCALE_MIN, scale));
}

// Deplace la carte d'un delta exprime en unites viewBox.
export function panBy(vp: Viewport, dvx: number, dvy: number): Viewport {
  return { ...vp, vx: vp.vx + dvx, vy: vp.vy + dvy };
}

// Zoome d'un facteur en gardant le point focal (fx,fy, en unites viewBox ecran)
// immobile sous le doigt / curseur. Renvoie un viewport inchange si l'echelle est
// deja a la borne (le point reste alors fixe, comme attendu).
export function zoomAt(vp: Viewport, facteur: number, fx: number, fy: number): Viewport {
  const scale = clampScale(vp.scale * facteur);
  // Point monde actuellement sous le focal.
  const wx = (fx - vp.vx) / vp.scale;
  const wy = (fy - vp.vy) / vp.scale;
  // On repositionne la translation pour que ce point reste sous le focal.
  return { vx: fx - wx * scale, vy: fy - wy * scale, scale };
}

// Reinitialise le viewport (bouton "reset").
export function resetViewport(): Viewport {
  return { ...VIEWPORT_INITIAL };
}

// Chaine de transformation SVG a poser sur le groupe de la carte.
export function transformCss(vp: Viewport): string {
  return `translate(${vp.vx},${vp.vy}) scale(${vp.scale})`;
}

// Epaisseur de trait compensee par le zoom : les frontieres restent fines a fort zoom
// (reprend la regle `0.5 / scale` de l'ancien site).
export function strokeWidth(vp: Viewport): number {
  return 0.5 / vp.scale;
}
