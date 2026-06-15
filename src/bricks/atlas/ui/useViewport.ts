import { useCallback, useEffect, useRef, useState } from 'react';
import {
  VIEWPORT_INITIAL,
  panBy,
  zoomAt,
  resetViewport,
  type Viewport,
} from '../logic/viewport';

/*
  Hook d'interaction de la carte : pan, zoom molette, zoom par boutons et pincement
  tactile. Tout passe par les Pointer Events (souris, doigt et stylet unifies). Les
  maths (translate/scale, focal, bornes) viennent de logic/viewport ; ici on ne fait
  que capter les gestes et convertir l'ecran vers le repere viewBox via la CTM du SVG.

  Demontage propre : le seul listener natif (wheel, en passive:false pour pouvoir
  bloquer le scroll de page) est retire au cleanup. Les listeners pointeur sont des
  handlers React poses sur le <svg> (liberes avec le noeud).
*/

interface GestePinch {
  distance: number;
}

export interface ControleurViewport {
  vp: Viewport;
  onPointerDown: (e: React.PointerEvent<SVGSVGElement>) => void;
  onPointerMove: (e: React.PointerEvent<SVGSVGElement>) => void;
  onPointerUp: (e: React.PointerEvent<SVGSVGElement>) => void;
  zoomBouton: (facteur: number) => void;
  reset: () => void;
  enDeplacement: boolean;
  // Vrai si le dernier geste a reellement deplace/zoome la carte : sert a distinguer
  // un clic sur un pays d'un simple glissement relache (on ignore alors le clic).
  vientDeBouger: () => boolean;
}

export function useViewport(svgRef: React.RefObject<SVGSVGElement>): ControleurViewport {
  const [vp, setVp] = useState<Viewport>(VIEWPORT_INITIAL);
  const [enDeplacement, setEnDeplacement] = useState(false);

  // Etat transient des gestes (refs : ne declenche pas de rendu).
  const pointeurs = useRef<Map<number, { x: number; y: number }>>(new Map());
  const dernierPoint = useRef<{ x: number; y: number } | null>(null);
  const pinch = useRef<GestePinch | null>(null);
  const aBouge = useRef(false);

  // Convertit un point ecran (clientX/Y) en coordonnees viewBox via la CTM du SVG.
  const ecranVersSvg = useCallback(
    (clientX: number, clientY: number): { x: number; y: number } => {
      const svg = svgRef.current;
      const ctm = svg?.getScreenCTM();
      if (!svg || !ctm) return { x: 0, y: 0 };
      const pt = svg.createSVGPoint();
      pt.x = clientX;
      pt.y = clientY;
      const p = pt.matrixTransform(ctm.inverse());
      return { x: p.x, y: p.y };
    },
    [svgRef],
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      e.currentTarget.setPointerCapture(e.pointerId);
      pointeurs.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      aBouge.current = false;
      if (pointeurs.current.size === 1) {
        dernierPoint.current = ecranVersSvg(e.clientX, e.clientY);
        setEnDeplacement(true);
      } else if (pointeurs.current.size === 2) {
        // Debut de pincement : on memorise la distance entre les deux doigts.
        const [a, b] = [...pointeurs.current.values()];
        if (a && b) pinch.current = { distance: Math.hypot(a.x - b.x, a.y - b.y) };
        dernierPoint.current = null;
      }
    },
    [ecranVersSvg],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      if (!pointeurs.current.has(e.pointerId)) return;
      pointeurs.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (pointeurs.current.size >= 2 && pinch.current) {
        // Pincement : ratio de distance = facteur de zoom, centre = milieu des doigts.
        const [a, b] = [...pointeurs.current.values()];
        if (!a || !b) return;
        const distance = Math.hypot(a.x - b.x, a.y - b.y);
        if (pinch.current.distance > 0) {
          const facteur = distance / pinch.current.distance;
          const milieu = ecranVersSvg((a.x + b.x) / 2, (a.y + b.y) / 2);
          setVp((v) => zoomAt(v, facteur, milieu.x, milieu.y));
        }
        pinch.current = { distance };
        aBouge.current = true;
        return;
      }

      // Pan a un doigt / souris : delta en unites viewBox.
      if (dernierPoint.current) {
        const cur = ecranVersSvg(e.clientX, e.clientY);
        const dvx = cur.x - dernierPoint.current.x;
        const dvy = cur.y - dernierPoint.current.y;
        if (dvx !== 0 || dvy !== 0) aBouge.current = true;
        setVp((v) => panBy(v, dvx, dvy));
        dernierPoint.current = cur;
      }
    },
    [ecranVersSvg],
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      pointeurs.current.delete(e.pointerId);
      if (pointeurs.current.size < 2) pinch.current = null;
      if (pointeurs.current.size === 0) {
        dernierPoint.current = null;
        setEnDeplacement(false);
      } else {
        // Il reste un doigt : on reprend le pan a sa position (sans saut).
        const [reste] = [...pointeurs.current.values()];
        dernierPoint.current = reste ? ecranVersSvg(reste.x, reste.y) : null;
      }
    },
    [ecranVersSvg],
  );

  const zoomBouton = useCallback(
    (facteur: number) => {
      const svg = svgRef.current;
      const cx = svg ? svg.viewBox.baseVal.width / 2 : 600;
      const cy = svg ? svg.viewBox.baseVal.height / 2 : 300;
      setVp((v) => zoomAt(v, facteur, cx, cy));
    },
    [svgRef],
  );

  const reset = useCallback(() => setVp(resetViewport()), []);
  const vientDeBouger = useCallback(() => aBouge.current, []);

  // Zoom molette : listener natif (passive:false) pour bloquer le scroll de page.
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    function onWheel(e: WheelEvent) {
      e.preventDefault();
      const facteur = e.deltaY < 0 ? 1.25 : 0.8;
      const p = ecranVersSvg(e.clientX, e.clientY);
      setVp((v) => zoomAt(v, facteur, p.x, p.y));
    }
    svg.addEventListener('wheel', onWheel, { passive: false });
    return () => svg.removeEventListener('wheel', onWheel);
  }, [svgRef, ecranVersSvg]);

  return {
    vp,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    zoomBouton,
    reset,
    enDeplacement,
    vientDeBouger,
  };
}
