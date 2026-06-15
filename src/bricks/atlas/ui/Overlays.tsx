import type { CouchesAtlas } from '../../../core/content/atlas.schema';
import { ressourcesFiltrees } from '../logic/colors';
import { lonlatVersSvg, polylignePoints, SVG_LARGEUR } from '../logic/projection';
import styles from './Atlas.module.css';

/*
  Surimpressions dessinees DANS le groupe transforme (elles suivent donc pan et zoom),
  comme dans l'ancien site :
   - RessourcesOverlay : pour chaque pays, une petite grille d'icones emoji posee sur le
     centroide, restreinte au groupe de couche actif (energie / minerais).
   - MaritimeOverlay : les grandes routes (polylignes animees) et les detroits (points
     pulses, colores par niveau de criticite, avec infobulle native).
*/

const TAILLE_ICONE = 9; // rayon des pastilles de ressources (unites viewBox)
const ECART = 2;

export function RessourcesOverlay({
  couches,
  groupeId,
  centroids,
}: {
  couches: CouchesAtlas;
  groupeId: string;
  centroids: Record<string, [number, number]>;
}) {
  const res = couches.ressources;
  if (!res) return null;

  return (
    <g className={styles.overlayInert}>
      {Object.keys(res.data).map((iso) => {
        const ressources = ressourcesFiltrees(iso, groupeId, couches);
        const cent = centroids[iso];
        if (ressources.length === 0 || !cent) return null;
        const [cx, cy] = lonlatVersSvg(cent[0], cent[1]);
        return (
          <GrilleRessources key={iso} ressources={ressources} meta={res.meta} cx={cx} cy={cy} />
        );
      })}
    </g>
  );
}

function GrilleRessources({
  ressources,
  meta,
  cx,
  cy,
}: {
  ressources: string[];
  meta: NonNullable<CouchesAtlas['ressources']>['meta'];
  cx: number;
  cy: number;
}) {
  const n = ressources.length;
  const cols = Math.min(n, 4);
  const rows = Math.ceil(n / cols);
  const pas = TAILLE_ICONE * 2 + ECART;
  const totalW = cols * pas - ECART;
  const totalH = rows * pas - ECART;

  return (
    <g>
      {ressources.map((r, i) => {
        const m = meta[r];
        if (!m) return null;
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = cx - totalW / 2 + col * pas + TAILLE_ICONE;
        const y = cy - totalH / 2 + row * pas + TAILLE_ICONE;
        return (
          <g key={r}>
            <circle cx={x} cy={y} r={TAILLE_ICONE} fill={m.color} className={styles.resDot} />
            <text x={x} y={y + 1} className={styles.resEmoji}>
              {m.icon}
            </text>
          </g>
        );
      })}
    </g>
  );
}

export function MaritimeOverlay({ maritime }: { maritime: NonNullable<CouchesAtlas['maritime']> }) {
  return (
    <g>
      <g className={styles.overlayInert}>
        {maritime.routes.map((r, i) => {
          const points = polylignePoints(r.pts);
          // Triple copie decalee d'une largeur de monde : une route qui sort par un bord
          // (passage de l'antimeridien, ex. Trans-Pacifique) reapparait par l'autre.
          return (
            <g key={i}>
              {[-SVG_LARGEUR, 0, SVG_LARGEUR].map((dx) => (
                <polyline
                  key={dx}
                  points={points}
                  transform={`translate(${dx},0)`}
                  className={styles.routeLine}
                  style={{ stroke: r.color, strokeWidth: r.w }}
                />
              ))}
            </g>
          );
        })}
      </g>
      {maritime.detroits.map((d) => {
        const [x, y] = lonlatVersSvg(d.lon, d.lat);
        const couleur = maritime.niveauCouleurs[d.level] ?? '#ffffff';
        return (
          <g key={d.id} className={styles.detroit}>
            <circle cx={x} cy={y} r={4} fill={couleur} className={styles.detroitPulse} />
            <circle cx={x} cy={y} r={2.5} fill={couleur} className={styles.detroitDot} />
            <title>
              {d.name}
              {d.pct ? ` - ${d.pct}` : ''}
            </title>
          </g>
        );
      })}
    </g>
  );
}
