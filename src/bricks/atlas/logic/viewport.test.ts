import { describe, it, expect } from 'vitest';
import {
  VIEWPORT_INITIAL,
  SCALE_MIN,
  SCALE_MAX,
  clampScale,
  panBy,
  zoomAt,
  resetViewport,
  transformCss,
  strokeWidth,
} from './viewport';
import { lonlatVersSvg, polylignePoints, SVG_LARGEUR, SVG_HAUTEUR } from './projection';

describe('viewport - clamp', () => {
  it('borne l echelle entre min et max', () => {
    expect(clampScale(0.1)).toBe(SCALE_MIN);
    expect(clampScale(100)).toBe(SCALE_MAX);
    expect(clampScale(2)).toBe(2);
  });
});

describe('viewport - pan', () => {
  it('translate sans toucher a l echelle', () => {
    const vp = panBy(VIEWPORT_INITIAL, 10, -5);
    expect(vp).toEqual({ vx: 10, vy: -5, scale: 1 });
  });
});

describe('viewport - zoom focal', () => {
  it('garde le point focal immobile sous le curseur', () => {
    const fx = 300;
    const fy = 150;
    const apres = zoomAt(VIEWPORT_INITIAL, 2, fx, fy);
    // Le point ecran (fx,fy) doit correspondre au meme point monde avant/apres.
    const mondeAvantX = (fx - VIEWPORT_INITIAL.vx) / VIEWPORT_INITIAL.scale;
    const mondeAvantY = (fy - VIEWPORT_INITIAL.vy) / VIEWPORT_INITIAL.scale;
    const ecranApresX = apres.vx + mondeAvantX * apres.scale;
    const ecranApresY = apres.vy + mondeAvantY * apres.scale;
    expect(ecranApresX).toBeCloseTo(fx);
    expect(ecranApresY).toBeCloseTo(fy);
    expect(apres.scale).toBe(2);
  });

  it('respecte les bornes de zoom', () => {
    expect(zoomAt(VIEWPORT_INITIAL, 1000, 0, 0).scale).toBe(SCALE_MAX);
    expect(zoomAt(VIEWPORT_INITIAL, 0.001, 0, 0).scale).toBe(SCALE_MIN);
  });
});

describe('viewport - rendu', () => {
  it('produit la chaine de transformation attendue', () => {
    expect(transformCss({ vx: 10, vy: 20, scale: 2 })).toBe('translate(10,20) scale(2)');
  });
  it('compense l epaisseur de trait par le zoom', () => {
    expect(strokeWidth({ vx: 0, vy: 0, scale: 1 })).toBe(0.5);
    expect(strokeWidth({ vx: 0, vy: 0, scale: 10 })).toBe(0.05);
  });
  it('reset revient a l etat initial', () => {
    expect(resetViewport()).toEqual(VIEWPORT_INITIAL);
  });
});

describe('projection lon/lat -> SVG', () => {
  it('place le centre (0,0) au milieu du viewBox', () => {
    expect(lonlatVersSvg(0, 0)).toEqual([SVG_LARGEUR / 2, SVG_HAUTEUR / 2]);
  });
  it('place les coins extremes', () => {
    expect(lonlatVersSvg(-180, 90)).toEqual([0, 0]);
    expect(lonlatVersSvg(180, -90)).toEqual([SVG_LARGEUR, SVG_HAUTEUR]);
  });
  it('serialise une polyligne en attribut points', () => {
    expect(polylignePoints([[0, 0], [180, -90]])).toBe('600,300 1200,600');
  });
});
