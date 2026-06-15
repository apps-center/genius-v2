import { useEffect, useMemo, useRef, useState } from 'react';
import type { AppContext } from '../../../core/context';
import { AppProvider } from '../../../core/context';
import { ContentError } from '../../../core/content/load';
import type { AtlasPack, EntreeCouche } from '../../../core/content/atlas.schema';
import { manifest } from '../manifest';
import { transformCss, strokeWidth } from '../logic/viewport';
import { fillPays } from '../logic/colors';
import { useViewport } from './useViewport';
import { Fiche } from './Fiche';
import { LayerBar } from './LayerBar';
import { Legende } from './Legende';
import { RessourcesOverlay, MaritimeOverlay } from './Overlays';
import styles from './Atlas.module.css';

/*
  ui/ : rendu uniquement. Toute la mecanique de viewport (pan/zoom/pincement) vient de
  logic/viewport et du hook useViewport. La brique lit son sujet/titre dans l'URL : elle
  fonctionne identiquement montee seule (dev) ou dans le shell.

  Phase 1 : carte du monde (geometrie + couleur de base), deplacement et zoom, infobulle
  au survol, selection d'un pays. Les couches thematiques et la fiche pays detaillee
  arrivent dans les phases suivantes, sans toucher a cette charpente.
*/

interface Cible {
  sujet: string;
  titre: string | undefined;
}

function cibleDepuisUrl(): Cible {
  const params = new URLSearchParams(window.location.search);
  return {
    sujet: params.get('sujet') ?? 'geographie',
    titre: params.get('titre') ?? undefined,
  };
}

export function App({ ctx }: { ctx: AppContext }) {
  return (
    <AppProvider ctx={ctx}>
      <Atlas ctx={ctx} />
    </AppProvider>
  );
}

type Chargement =
  | { statut: 'chargement' }
  | { statut: 'erreur'; message: string }
  | { statut: 'pret'; pack: AtlasPack };

function Atlas({ ctx }: { ctx: AppContext }) {
  const cible = useMemo(cibleDepuisUrl, []);
  const [chargement, setChargement] = useState<Chargement>({ statut: 'chargement' });

  useEffect(() => {
    ctx.events.emit('activity.start', { brick: manifest.id, sujet: cible.sujet });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let actif = true;
    ctx.content
      .loadPack(cible.sujet, 'atlas', cible.titre)
      .then((pack) => actif && setChargement({ statut: 'pret', pack }))
      .catch((err: unknown) => {
        if (!actif) return;
        const message =
          err instanceof ContentError
            ? err.message
            : `Contenu introuvable pour le sujet "${cible.sujet}".`;
        setChargement({ statut: 'erreur', message });
      });
    return () => {
      actif = false;
    };
  }, [ctx, cible.sujet, cible.titre]);

  return (
    <div className={styles.wrap}>
      <header className={styles.head}>
        <p className={styles.kicker}>Atlas geopolitique</p>
        <h1 className={styles.titre}>
          {chargement.statut === 'pret' ? chargement.pack.titre : 'Monde'}
        </h1>
        {chargement.statut === 'pret' && (
          <p className={styles.sous}>
            {chargement.pack.pays.length} territoires - survole ou touche un pays
          </p>
        )}
      </header>

      {chargement.statut === 'chargement' && (
        <p className={styles.state}>Chargement de la carte...</p>
      )}
      {chargement.statut === 'erreur' && (
        <div className={`${styles.state} ${styles.error}`} role="alert">
          <p className={styles.errorTitle}>Pack non charge</p>
          <p className={styles.errorMsg}>{chargement.message}</p>
        </div>
      )}
      {chargement.statut === 'pret' && <Carte ctx={ctx} pack={chargement.pack} />}
    </div>
  );
}

interface Survol {
  nom: string;
  x: number;
  y: number;
  aFiche: boolean;
}

function Carte({ ctx, pack }: { ctx: AppContext; pack: AtlasPack }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const zoneRef = useRef<HTMLDivElement>(null);
  const [selectionne, setSelectionne] = useState<string | null>(null);
  const [survol, setSurvol] = useState<Survol | null>(null);
  // Pays sous le pointeur au debut du geste : selectionne au "tap" (clic sans glissement).
  const candidat = useRef<string | null>(null);

  function onTap() {
    const iso = candidat.current;
    if (!iso) return;
    setSelectionne(iso);
    ctx.events.emit('atlas.country.selected', { brick: manifest.id, sujet: pack.sujet, iso });
  }

  const vue = useViewport(svgRef, onTap);

  // Couche active : la couche de base (Monde) par defaut, sinon la premiere declaree.
  const coucheParDefaut = useMemo(() => couchePremiere(pack), [pack]);
  const [couche, setCouche] = useState<EntreeCouche>(coucheParDefaut);

  // Index iso -> trace, pour retrouver nom/continent au clic (repli si pas de fiche).
  const parIso = useMemo(() => new Map(pack.pays.map((p) => [p.id, p])), [pack.pays]);
  const paysSelectionne = selectionne ? parIso.get(selectionne) : undefined;

  function onChangerCouche(c: EntreeCouche) {
    setCouche(c);
    ctx.events.emit('atlas.layer.changed', { brick: manifest.id, sujet: pack.sujet, layer: c.id });
  }

  function onSurvol(iso: string, nom: string, e: React.PointerEvent) {
    const zone = zoneRef.current;
    if (!zone) return;
    const rect = zone.getBoundingClientRect();
    setSurvol({
      nom,
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      aFiche: !!pack.fiches[iso],
    });
  }

  return (
    <>
    <LayerBar pack={pack} coucheActiveId={couche.id} onSelect={onChangerCouche} />
    <div className={styles.mapZone} ref={zoneRef}>
      <svg
        ref={svgRef}
        className={`${styles.svg} ${vue.enDeplacement ? styles.svgPan : ''}`}
        viewBox={pack.viewBox}
        preserveAspectRatio="xMidYMid meet"
        role="application"
        aria-label="Carte du monde interactive : faites glisser pour deplacer, la molette ou le pincement pour zoomer"
        onPointerDown={vue.onPointerDown}
        onPointerMove={vue.onPointerMove}
        onPointerUp={vue.onPointerUp}
        onPointerCancel={vue.onPointerUp}
        onPointerLeave={() => setSurvol(null)}
      >
        <rect
          x="0"
          y="0"
          width="1200"
          height="600"
          className={styles.ocean}
          onPointerDown={() => {
            candidat.current = null;
          }}
        />
        {/* Epaisseur de trait posee sur le groupe (valeur dynamique derivee du zoom),
            heritee par tous les traces : les frontieres restent fines a fort zoom. */}
        <g transform={transformCss(vue.vp)} style={{ strokeWidth: strokeWidth(vue.vp) }}>
          {pack.pays.map((p) => (
            <path
              key={p.id}
              d={p.d}
              fill={fillPays(p, couche.id, couche.type, pack.couches)}
              className={`${styles.land} ${selectionne === p.id ? styles.landSel : ''}`}
              onPointerDown={() => {
                candidat.current = p.id;
              }}
              onPointerEnter={(e) => onSurvol(p.id, p.name, e)}
              onPointerMove={(e) => onSurvol(p.id, p.name, e)}
            />
          ))}
          {couche.type === 'ressources' && (
            <RessourcesOverlay couches={pack.couches} groupeId={couche.id} centroids={pack.centroids} />
          )}
          {couche.type === 'maritime' && pack.couches.maritime && (
            <MaritimeOverlay maritime={pack.couches.maritime} />
          )}
        </g>
      </svg>

      {survol && (
        <div className={styles.tooltip} style={{ left: survol.x, top: survol.y }} aria-hidden="true">
          <span className={styles.tooltipNom}>{survol.nom}</span>
          {survol.aFiche && <span className={styles.tooltipFiche}>Fiche -&gt;</span>}
        </div>
      )}

      <div className={styles.controls}>
        <button
          type="button"
          className={styles.zoomBtn}
          onClick={() => vue.zoomBouton(1.25)}
          aria-label="Zoomer"
        >
          +
        </button>
        <button
          type="button"
          className={styles.zoomBtn}
          onClick={() => vue.zoomBouton(0.8)}
          aria-label="Dezoomer"
        >
          &minus;
        </button>
        <button
          type="button"
          className={styles.zoomBtn}
          onClick={vue.reset}
          aria-label="Reinitialiser la vue"
        >
          &#8634;
        </button>
      </div>

      <Legende pack={pack} couche={couche} />

      {paysSelectionne && (
        <Fiche
          key={paysSelectionne.id}
          nomCarte={paysSelectionne.name}
          continentCarte={paysSelectionne.cont}
          fiche={pack.fiches[paysSelectionne.id]}
          capitale={pack.capitales[paysSelectionne.id]}
          onFermer={() => setSelectionne(null)}
        />
      )}
    </div>
    </>
  );
}

// Couche affichee par defaut : la couche de base (Monde) si presente, sinon la premiere.
function couchePremiere(pack: AtlasPack): EntreeCouche {
  const toutes = pack.navConfig.flatMap((c) => c.layers);
  return toutes.find((l) => l.type === 'base') ?? toutes[0] ?? { id: 'world', label: 'Monde', type: 'base' };
}
