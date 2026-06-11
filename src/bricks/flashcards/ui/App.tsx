import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { AppContext } from '../../../core/context';
import { AppProvider } from '../../../core/context';
import { ContentError } from '../../../core/content/load';
import type {
  Flashcard,
  FlashcardsPack,
  Illustration as IllustrationType,
} from '../../../core/content/flashcards.schema';
import {
  initDeck,
  retourner,
  suivante,
  precedente,
  melanger,
  ordreNormal,
  indexCourant,
  estPremiere,
  estDerniere,
  numeroCarte,
  type DeckState,
} from '../logic/deck';
import { manifest } from '../manifest';
import styles from './Flashcards.module.css';

/*
  ui/ : rendu uniquement. Toute la mecanique (position, retournement, bornes) vient de
  logic/deck. La brique lit son deck (sujet/titre) dans l'URL : elle fonctionne
  identiquement montee seule (dev) ou dans le shell. Deux modeles de carte sont rendus
  selon le champ discriminant `type` ('image' | 'qr'), jamais selon un sujet code en dur.

  PERIMETRE : un deck qui se joue. Pas d'ecran d'entree (stats, grille de themes, Mode
  Genius), pas de filtres categorie/niveau : ces elements viendront plus tard.
*/

interface Cible {
  sujet: string;
  titre: string | undefined;
}

function cibleDepuisUrl(): Cible {
  const params = new URLSearchParams(window.location.search);
  return {
    sujet: params.get('sujet') ?? '',
    titre: params.get('titre') ?? undefined,
  };
}

export function App({ ctx }: { ctx: AppContext }) {
  return (
    <AppProvider ctx={ctx}>
      <Flashcards ctx={ctx} />
    </AppProvider>
  );
}

type Chargement =
  | { statut: 'chargement' }
  | { statut: 'erreur'; message: string }
  | { statut: 'pret'; pack: FlashcardsPack };

function Flashcards({ ctx }: { ctx: AppContext }) {
  const cible = useMemo(cibleDepuisUrl, []);
  const [chargement, setChargement] = useState<Chargement>({ statut: 'chargement' });

  // Evenement de domaine : debut de consultation (consomme par gamification/telemetrie).
  useEffect(() => {
    ctx.events.emit('activity.start', { brick: manifest.id, sujet: cible.sujet });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let actif = true;
    setChargement({ statut: 'chargement' });
    ctx.content
      .loadPack(cible.sujet, 'flashcards', cible.titre)
      .then((pack) => actif && setChargement({ statut: 'pret', pack }))
      .catch((err: unknown) => {
        if (!actif) return;
        const message =
          err instanceof ContentError
            ? err.message
            : `Deck introuvable pour le sujet "${cible.sujet}".`;
        setChargement({ statut: 'erreur', message });
      });
    return () => {
      actif = false;
    };
  }, [ctx, cible.sujet, cible.titre]);

  const pack = chargement.statut === 'pret' ? chargement.pack : undefined;
  const titreAffiche = pack?.titre ?? cible.titre ?? 'Flashcards';

  return (
    <div className={styles.wrap}>
      <header className={styles.head}>
        <p className={styles.kicker}>Flashcards</p>
        <h1 className={styles.titre}>{titreAffiche}</h1>
        {pack && <p className={styles.sous}>{pack.cartes.length} cartes a reviser</p>}
      </header>

      {chargement.statut === 'chargement' && (
        <p className={styles.state}>Chargement du deck...</p>
      )}
      {chargement.statut === 'erreur' && (
        <div className={`${styles.state} ${styles.error}`} role="alert">
          <p className={styles.errorTitle}>Deck non charge</p>
          <p className={styles.errorMsg}>{chargement.message}</p>
        </div>
      )}
      {pack && <Deck ctx={ctx} pack={pack} />}
    </div>
  );
}

// Exporte pour le test de comportement (ui/), qui verrouille l'absence de flip parasite
// a la navigation. La frontiere de brique (brick.tsx) reste inchangee : manifest/mount/unmount.
export function Deck({ ctx, pack }: { ctx: AppContext; pack: FlashcardsPack }) {
  const cartes = pack.cartes;
  const [state, setState] = useState<DeckState>(() => initDeck(cartes.length));
  // Memoire des decks deja "completes" : evite de re-emettre deck.completed.
  const completeRef = useRef(false);

  // Reinitialise si le deck change (changement de sujet/titre sans remontage de brique).
  useEffect(() => {
    setState(initDeck(cartes.length));
    completeRef.current = false;
  }, [cartes]);

  const carte = cartes[indexCourant(state)];

  // Flip instantane (sans animation) le temps d'un changement de carte : la remise au
  // recto lors d'une navigation ne doit pas etre animee (sinon la carte se retourne
  // visiblement avant d'afficher la suivante). Le retournement VOLONTAIRE reste anime.
  const [flipInstant, setFlipInstant] = useState(false);

  const flip = useCallback(() => {
    setState((s) => {
      const next = retourner(s);
      const courante = cartes[indexCourant(s)];
      if (courante) {
        ctx.events.emit('card.flipped', {
          brick: manifest.id,
          sujet: pack.sujet,
          cardId: courante.id,
          face: next.revelee ? 'verso' : 'recto',
        });
      }
      return next;
    });
  }, [ctx, pack.sujet, cartes]);

  const aller = useCallback(
    (sens: 'suivante' | 'precedente') => {
      // Coupe la transition de flip pour ce changement : la nouvelle carte apparait
      // directement sur son recto, sans retournement parasite.
      setFlipInstant(true);
      setState((s) => (sens === 'suivante' ? suivante(s) : precedente(s)));
    },
    [],
  );

  // Changement d'ordre d'affichage (melange / retour a l'ordre original). On revient a la
  // carte 1 sur le recto : on coupe la transition (comme la navigation) pour eviter un flip
  // parasite si la carte courante etait sur le verso. Le deck redevient "non complete".
  const melangerDeck = useCallback(() => {
    setFlipInstant(true);
    setState((s) => melanger(s));
    completeRef.current = false;
    ctx.events.emit('deck.shuffled', {
      brick: manifest.id,
      sujet: pack.sujet,
      total: cartes.length,
    });
  }, [ctx, pack.sujet, cartes.length]);

  const ordreOriginal = useCallback(() => {
    setFlipInstant(true);
    setState((s) => ordreNormal(s));
    completeRef.current = false;
  }, []);

  // Une fois la remise au recto peinte sans transition, on retablit l'animation pour
  // les prochains retournements volontaires. DOUBLE requestAnimationFrame : un seul ne
  // suffit pas. L'effet passif de React et le rAF peuvent s'executer dans la meme frame
  // AVANT toute peinture ; le navigateur ne voit alors jamais .instant et anime quand
  // meme le retour au recto (le flip parasite). Le 1er rAF laisse le navigateur PEINDRE
  // l'etat recto pendant que .instant coupe la transition (la variation 180deg -> 0 est
  // donc capturee SANS animation comme nouvelle base) ; le 2e rAF retablit la transition
  // une fois cette peinture confirmee, transform valant deja 0 -> aucun retournement.
  useEffect(() => {
    if (!flipInstant) return;
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setFlipInstant(false));
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [flipInstant]);

  // Evenement de domaine : la derniere carte du deck a ete atteinte (une seule fois).
  useEffect(() => {
    if (estDerniere(state) && !completeRef.current) {
      completeRef.current = true;
      ctx.events.emit('deck.completed', {
        brick: manifest.id,
        sujet: pack.sujet,
        total: state.total,
      });
    }
  }, [ctx, pack.sujet, state]);

  // Navigation clavier globale : fleches gauche/droite. Le retournement (Entree/Espace)
  // est gere sur la carte elle-meme (focus). Nettoyage au demontage : aucun listener actif.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        aller('suivante');
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        aller('precedente');
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [aller]);

  const sansAnim = ctx.settings.reducedMotion;
  const progression = Math.round((numeroCarte(state) / state.total) * 100);

  // Borne toujours valide en pratique ; garde-fou pour le typage strict (index access).
  if (!carte) return null;

  return (
    <div className={styles.deck}>
      <div className={styles.modeOrdre} role="group" aria-label="Ordre des cartes">
        <button
          type="button"
          className={styles.ordreBtn}
          aria-pressed={!state.melange}
          onClick={ordreOriginal}
        >
          Ordre normal
        </button>
        <button
          type="button"
          className={styles.ordreBtn}
          aria-pressed={state.melange}
          onClick={melangerDeck}
        >
          Melanger
        </button>
      </div>

      <div className={styles.progress}>
        <p className={styles.compteur} aria-live="polite">
          Carte {numeroCarte(state)} / {state.total}
        </p>
        <div
          className={styles.barre}
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={state.total}
          aria-valuenow={numeroCarte(state)}
        >
          <span className={styles.barreRemplie} style={{ inlineSize: `${progression}%` }} />
        </div>
      </div>

      <Carte
        carte={carte}
        revelee={state.revelee}
        sansAnim={sansAnim}
        instant={flipInstant}
        onFlip={flip}
      />

      <div className={styles.controles}>
        <button
          type="button"
          className={styles.nav}
          onClick={() => aller('precedente')}
          disabled={estPremiere(state)}
        >
          Precedente
        </button>
        <button type="button" className={styles.flipBtn} onClick={flip}>
          {state.revelee ? 'Voir le recto' : 'Reveler'}
        </button>
        <button
          type="button"
          className={styles.nav}
          onClick={() => aller('suivante')}
          disabled={estDerniere(state)}
        >
          Suivante
        </button>
      </div>
    </div>
  );
}

function Carte({
  carte,
  revelee,
  sansAnim,
  instant,
  onFlip,
}: {
  carte: Flashcard;
  revelee: boolean;
  sansAnim: boolean;
  instant: boolean;
  onFlip: () => void;
}) {
  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onFlip();
    }
  }

  return (
    <div
      className={`${styles.flipWrap} ${sansAnim ? styles.sansAnim : ''} ${
        instant ? styles.instant : ''
      }`}
      role="button"
      tabIndex={0}
      aria-label={revelee ? 'Carte retournee : voir le recto' : 'Reveler la carte'}
      onClick={onFlip}
      onKeyDown={onKeyDown}
    >
      <div className={styles.flipInner} data-revelee={revelee || undefined}>
        <div className={`${styles.face} ${styles.faceRecto}`} aria-hidden={revelee || undefined}>
          {carte.type === 'image' ? <RectoImage carte={carte} /> : <RectoQr carte={carte} />}
          <p className={styles.hint} aria-hidden="true">
            Cliquer pour reveler
          </p>
        </div>
        <div
          className={`${styles.face} ${styles.faceVerso}`}
          aria-hidden={!revelee || undefined}
        >
          {carte.type === 'image' ? <VersoImage carte={carte} /> : <VersoQr carte={carte} />}
        </div>
      </div>
    </div>
  );
}

// --- Modele IMAGE : recto = image plein cadre, verso = epoque + date + titre + description ---
function RectoImage({ carte }: { carte: Extract<Flashcard, { type: 'image' }> }) {
  return (
    <img className={styles.image} src={carte.image} alt={carte.titre} decoding="async" />
  );
}

function VersoImage({ carte }: { carte: Extract<Flashcard, { type: 'image' }> }) {
  return (
    <div className={styles.versoCorps}>
      {carte.epoque && <span className={styles.epoque}>{carte.epoque}</span>}
      <p className={styles.date}>{carte.date}</p>
      <h2 className={styles.carteTitre}>{carte.titre}</h2>
      <p className={styles.description}>{carte.description}</p>
    </div>
  );
}

// --- Modele QR : recto = (categorie) + question + (illustration), verso = reponse + explication ---
function RectoQr({ carte }: { carte: Extract<Flashcard, { type: 'qr' }> }) {
  return (
    <div className={styles.rectoCorps}>
      {carte.categorie && <span className={styles.categorie}>{carte.categorie}</span>}
      <p className={styles.question}>{carte.question}</p>
      {carte.illustration && <Illustration illustration={carte.illustration} />}
    </div>
  );
}

// Visuel d'appoint OPTIONNEL d'une carte qr. Absent du JSON = ce composant n'est jamais
// monte : une carte sans illustration s'affiche exactement comme avant. Deux formes :
//  - 'image' : bitmap servi sans rognage (meme strategie que le modele image).
//  - 'svg'   : markup inline RENDU DE MANIERE MAITRISEE. Le SVG provient de NOS packs
//    (valides Zod au chargement), jamais d'une source externe ; garde-fou supplementaire :
//    on n'injecte que si le contenu ressemble bien a un <svg> (sinon on n'affiche rien).
function Illustration({ illustration }: { illustration: IllustrationType }) {
  if (illustration.type === 'image') {
    return (
      <img
        className={styles.illustration}
        src={illustration.src}
        alt=""
        aria-hidden="true"
        decoding="async"
      />
    );
  }
  const svg = illustration.svg.trim();
  if (!svg.startsWith('<svg')) return null;
  return (
    <span
      className={styles.illustrationSvg}
      aria-hidden="true"
      // SVG issu de notre contenu valide (cf. commentaire ci-dessus), jamais d'entree externe.
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

function VersoQr({ carte }: { carte: Extract<Flashcard, { type: 'qr' }> }) {
  return (
    <div className={styles.versoCorps}>
      <span className={styles.label}>Reponse</span>
      <p className={styles.reponse}>{carte.reponse}</p>
      {carte.explication && <p className={styles.explication}>{carte.explication}</p>}
    </div>
  );
}
