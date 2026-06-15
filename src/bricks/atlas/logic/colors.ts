import type { CouchesAtlas, PaysAtlas, TypeCouche } from '../../../core/content/atlas.schema';

/*
  Resolution PURE de la couleur de remplissage d'un pays selon la couche active.
  ZERO React, ZERO DOM. Reprend la cascade de l'ancien site :
   - couche 'base' (Monde) : couleur de base figee a la migration ;
   - couche 'colors' (choropleth) : couleur du pays, sinon repli continental, sinon base ;
   - couche 'climat' : couleur de la zone climatique du pays, sinon base ;
   - couches 'ressources' / 'maritime' : la carte reste en couleur de base (le contenu
     thematique est dessine en surimpression, pas en teinte de pays).
*/

export function fillPays(
  pays: PaysAtlas,
  layerId: string,
  type: TypeCouche,
  couches: CouchesAtlas,
): string {
  if (type === 'colors') {
    const c = couches.colors[layerId];
    if (!c) return pays.baseColor;
    return c.pays[pays.id] ?? c.continentDefaut[pays.cont] ?? pays.baseColor;
  }
  if (type === 'climat') {
    const zone = couches.climat?.data[pays.id];
    const z = zone ? couches.climat?.zones[zone] : undefined;
    return z?.color ?? pays.baseColor;
  }
  // base, ressources, maritime : couleur de base (surimpression geree ailleurs).
  return pays.baseColor;
}

// Ressources d'un pays restreintes au groupe de couche actif (energy-res / minerais),
// dans l'ordre du pack. Renvoie un tableau vide si rien a afficher.
export function ressourcesFiltrees(
  iso: string,
  groupeId: string,
  couches: CouchesAtlas,
): string[] {
  const res = couches.ressources;
  if (!res) return [];
  const groupe = res.groupes[groupeId];
  const possedees = res.data[iso];
  if (!groupe || !possedees) return [];
  const autorisees = new Set(groupe.types);
  return possedees.filter((r) => autorisees.has(r));
}
