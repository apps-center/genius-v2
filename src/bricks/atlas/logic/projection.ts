/*
  Projection PURE longitude/latitude -> coordonnees viewBox SVG. ZERO React, ZERO DOM.
  Reprend la projection equirectangulaire simplifiee de l'ancien site, calee sur un
  viewBox de 1200 x 600 : lon [-180,180] -> [0,1200], lat [90,-90] -> [0,600]
  (axe Y inverse, le nord en haut).

  Sert a poser les overlays (icones de ressources sur les centroides, routes et detroits
  maritimes) aux bonnes coordonnees, en accord avec la geometrie des pays du pack.
*/

export const SVG_LARGEUR = 1200;
export const SVG_HAUTEUR = 600;

export function lonlatVersSvg(lon: number, lat: number): [number, number] {
  const x = ((lon + 180) / 360) * SVG_LARGEUR;
  const y = ((90 - lat) / 180) * SVG_HAUTEUR;
  return [x, y];
}

// Convertit une polyligne [lon,lat][] en attribut `points` pour <polyline>.
export function polylignePoints(pts: ReadonlyArray<readonly [number, number]>): string {
  return pts.map(([lon, lat]) => lonlatVersSvg(lon, lat).join(',')).join(' ');
}
