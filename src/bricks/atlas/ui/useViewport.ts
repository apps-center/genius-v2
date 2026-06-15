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

  Detection de "tap" : un geste a un seul pointeur qui ne depasse pas un petit seuil de
  deplacement est considere comme un clic (et non un glissement). On le signale via
  onTap, ce qui evite de dependre du onClick natif (perturbe par setPointerCapture).

  Demontage propre : le seul listener natif (wheel, en passive:false pour pouvoir
  bloquer le scroll de page) est retire au cleanup. Les listeners pointeur sont des
  handlers React poses sur le <svg> (liberes avec le noeud).
*/

// Seuil de deplacement (px ecran) au-dela duquel un geste devient un glissement.
const SEUIL_TAP = 6;

export interface ControleurViewport {
  vp: Viewport;
  onPointerDown: (e: React.PointerEvent<SVGSVGElement>) => void;
  onPointerMove: (e: React.PointerEvent<SVGSVGElement>) => void;
  onPointerUp: (e: React.PointerEvent<SVGSVGElement>) => void;
  zoomBouton: (facteur: number) => void;
  reset: () => void;
  enDeplacement: boolean;
}

export function useViewport(
  svgRef: React.RefObject<SVGSVGElement>,
  onTap?: () => void,
): ControleurViewport {
  const [vp, setVp] = useState<Viewport>(VIEWPORT_INITIAL);
  const [enDeplacement, setEnDeplacement] = useState(false);

  // Etat transient des gestes (refs : ne declenche pas de rendu).
  const pointeurs = useRef<Map<number, { x: number; y: number }>>(new Map());
  const dernierPoint = useRef<{ x: number; y: number } | null>(null);
  const debut = useRef<{ x: number; y: number } | null>(null); // origine ecran du geste
  const pinch = useRef<{ distance: number } | null>(null);
  const aBouge = useRef(false); // a depasse le seuil de deplacement
  const multi = useRef(false); // au moins deux doigts pendant le geste
  const onTapRef = useRef(onTap);
  onTapRef.current = onTap;

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
      // Empeche la selection / le drag natif du navigateur, qui sinon volent les
      // pointermove pendant le glissement (la carte semblerait alors figee).
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);
      pointeurs.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointeurs.current.size === 1) {
        debut.current = { x: e.clientX, y: e.clientY };
        aBouge.current = false;
        multi.current = false;
        dernierPoint.current = ecranVersSvg(e.clientX, e.clientY);
        setEnDeplacement(true);
      } else if (pointeurs.current.size === 2) {
        multi.current = true;
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

      // Pan a un doigt / souris. Au-dela du seuil ecran, le geste devient un glissement.
      if (dernierPoint.current && debut.current) {
        if (Math.hypot(e.clientX - debut.current.x, e.clientY - debut.current.y) > SEUIL_TAP) {
          aBouge.current = true;
        }
        const cur = ecranVersSvg(e.clientX, e.clientY);
        // Delta capture MAINTENANT : l'updater setVp s'execute de facon differee, et
        // dernierPoint.current peut etre remis a null entre-temps (pointerup tactile).
        const dvx = cur.x - dernierPoint.current.x;
        const dvy = cur.y - dernierPoint.current.y;
        dernierPoint.current = cur;
        setVp((v) => panBy(v, dvx, dvy));
      }
    },
    [ecranVersSvg],
  );

  const onPointerUp = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    pointeurs.current.delete(e.pointerId);
    if (pointeurs.current.size < 2) pinch.current = null;
    if (pointeurs.current.size === 0) {
      // Geste termine : un tap (un seul pointeur, sous le seuil) declenche la selection.
      if (!aBouge.current && !multi.current) onTapRef.current?.();
      dernierPoint.current = null;
      debut.current = null;
      setEnDeplacement(false);
    } else {
      const [reste] = [...pointeurs.current.values()];
      dernierPoint.current = reste ? ecranVersSvg(reste.x, reste.y) : null;
    }
  }, [ecranVersSvg]);

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

  return { vp, onPointerDown, onPointerMove, onPointerUp, zoomBouton, reset, enDeplacement };
}
