import { useEffect, useMemo, useRef, useState } from 'react';
import type { AppContext } from '../../../core/context';
import { AppProvider } from '../../../core/context';
import { ContentError } from '../../../core/content/load';
import type { ChronologiePack } from '../../../core/content/chronologie.schema';
import {
  construireFrise,
  compterEvenements,
  compterPeriodes,
  type EvenementFrise,
} from '../logic/frise';
import { manifest } from '../manifest';
import styles from './Frise.module.css';

/*
  ui/ : rendu uniquement. Toute la mecanique (regroupement, alternance) vient de
  logic/frise. La brique lit son sujet/titre dans l'URL : elle fonctionne identiquement
  montee seule (dev) ou dans le shell. Le contenu d'origine porte un peu de HTML de mise
  en forme (<b>, &nbsp;) ; il est statique et de confiance, rendu via RichText.
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
      <Chronologie ctx={ctx} />
    </AppProvider>
  );
}

type Chargement =
  | { statut: 'chargement' }
  | { statut: 'erreur'; message: string }
  | { statut: 'pret'; pack: ChronologiePack };

function Chronologie({ ctx }: { ctx: AppContext }) {
  const cible = useMemo(cibleDepuisUrl, []);

  // Les branches disponibles pour ce sujet sont DECOUVERTES depuis le registre
  // (ctx.content.list), jamais codees en dur : deposer un pack + 1 ligne de registre
  // ajoute son onglet, zero code dans la brique. L'ordre du registre pilote les onglets.
  const branches = useMemo(
    () => ctx.content.list('chronologie').filter((e) => e.sujet === cible.sujet),
    [ctx, cible],
  );

  // Branche active : celle de l'URL (lancement depuis l'accueil) sinon la premiere.
  const [titreActif, setTitreActif] = useState<string | undefined>(
    () => cible.titre ?? branches[0]?.titre,
  );
  const [chargement, setChargement] = useState<Chargement>({ statut: 'chargement' });

  // Evenement de domaine : debut de consultation (consomme par gamification/telemetrie).
  useEffect(() => {
    ctx.events.emit('activity.start', { brick: manifest.id, sujet: cible.sujet });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Recharge le pack a chaque changement de branche active. Anti-a-coup : on NE vide PAS
  // la frise actuelle pendant le chargement de la nouvelle periode (sinon la page se
  // contracte sur le message de chargement puis se redeploie). On garde la frise affichee
  // et on bascule seulement quand le nouveau pack est pret ; l'onglet actif, lui, reagit
  // tout de suite (feedback immediat). Le message "Chargement" ne s'affiche qu'au tout
  // premier rendu (aucune frise encore disponible).
  useEffect(() => {
    let actif = true;
    setChargement((c) => (c.statut === 'pret' ? c : { statut: 'chargement' }));
    ctx.content
      .loadPack(cible.sujet, 'chronologie', titreActif)
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
  }, [ctx, cible.sujet, titreActif]);

  const pack = chargement.statut === 'pret' ? chargement.pack : undefined;
  const titreAffiche = pack?.titre ?? titreActif ?? 'Chronologie';

  return (
    <div className={styles.wrap}>
      <header className={styles.head}>
        <p className={styles.kicker}>Chronologie historique</p>
        <h1 className={styles.titre}>{titreAffiche}</h1>
        {pack && (
          <p className={styles.sous}>
            {compterEvenements(pack.periodes)} evenements - {compterPeriodes(pack.periodes)} periodes
          </p>
        )}
      </header>

      {branches.length > 1 && (
        <nav className={styles.onglets} aria-label="Choisir une periode">
          {branches.map((b) => {
            const actif = b.titre === titreActif;
            return (
              <button
                key={b.titre}
                type="button"
                className={`${styles.onglet} ${actif ? styles.ongletActif : ''}`}
                aria-current={actif ? 'true' : undefined}
                onClick={() => setTitreActif(b.titre)}
              >
                {b.titre}
              </button>
            );
          })}
        </nav>
      )}

      {chargement.statut === 'chargement' && (
        <p className={styles.state}>Chargement de la frise...</p>
      )}
      {chargement.statut === 'erreur' && (
        <div className={`${styles.state} ${styles.error}`} role="alert">
          <p className={styles.errorTitle}>Pack non charge</p>
          <p className={styles.errorMsg}>{chargement.message}</p>
        </div>
      )}
      {pack && <Frise ctx={ctx} pack={pack} />}
    </div>
  );
}

function Frise({ ctx, pack }: { ctx: AppContext; pack: ChronologiePack }) {
  const sections = useMemo(() => construireFrise(pack.periodes), [pack]);

  // Evenement actuellement affiche dans la modale (null = modale fermee).
  const [selectionne, setSelectionne] = useState<EvenementFrise | null>(null);

  function ouvrir(ev: EvenementFrise) {
    setSelectionne(ev);
    // Evenement de domaine : la modale d'un evenement a ete ouverte.
    ctx.events.emit('anecdote.opened', {
      brick: manifest.id,
      sujet: pack.sujet,
      eventId: `${ev.numero}`,
    });
  }

  return (
    <>
      <div className={styles.timeline}>
        {sections.map((section, i) =>
          section.type === 'entete' ? (
            <div key={`entete:${i}:${section.era}`} className={styles.entete}>
              {section.era}
            </div>
          ) : (
            <section key={`periode:${i}:${section.era}`} className={styles.periode}>
              <h2 className={styles.era}>{section.era}</h2>
              <div className={styles.events}>
                {section.evenements.map((ev) => (
                  <Evenement key={ev.cle} ev={ev} onOuvrir={ouvrir} />
                ))}
              </div>
            </section>
          ),
        )}
      </div>

      {selectionne && (
        <Modale ev={selectionne} onFermer={() => setSelectionne(null)} />
      )}
    </>
  );
}

function Evenement({
  ev,
  onOuvrir,
}: {
  ev: EvenementFrise;
  onOuvrir: (ev: EvenementFrise) => void;
}) {
  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onOuvrir(ev);
    }
  }

  return (
    <article
      className={`${styles.card} ${ev.cote === 'gauche' ? styles.gauche : styles.droite}`}
      role="button"
      tabIndex={0}
      aria-label={`${ev.title} - ouvrir les details et anecdotes`}
      onClick={() => onOuvrir(ev)}
      onKeyDown={onKeyDown}
    >
      <span className={styles.point} aria-hidden="true" />
      {ev.img && (
        <img className={styles.image} src={ev.img} alt={ev.title} loading="lazy" decoding="async" />
      )}
      <div className={styles.cardBody}>
        <div className={styles.cardHead}>
          {ev.icon && (
            <span className={styles.icon} aria-hidden="true">
              {ev.icon}
            </span>
          )}
          {ev.tag && <span className={styles.tag}>{ev.tag}</span>}
        </div>
        <p className={styles.date}>{ev.date}</p>
        <h3 className={styles.cardTitle}>{ev.title}</h3>
        <RichText className={styles.desc} html={ev.desc} />
        <p className={styles.hint} aria-hidden="true">
          Cliquer pour les anecdotes
        </p>
      </div>
    </article>
  );
}

/*
  Modale centree par-dessus la frise (overlay sombre). Reproduit le comportement de
  l'ancien site : image, date, titre, description complete et anecdotes. Accessible :
  role dialog + aria-modal, focus pose sur la croix et piege dans la boite, fermeture
  au clic sur l'overlay, sur la croix ou via la touche Echap. Le focus revient sur la
  carte d'origine a la fermeture, le defilement de la page est gele pendant l'ouverture.
*/
function Modale({ ev, onFermer }: { ev: EvenementFrise; onFermer: () => void }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const fermerRef = useRef<HTMLButtonElement>(null);
  const titreId = `modale-titre-${ev.numero}`;
  const aAnecdotes = ev.anecdotes.length > 0;

  useEffect(() => {
    const precedent = document.activeElement as HTMLElement | null;
    fermerRef.current?.focus();
    const overflowInitial = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        onFermer();
        return;
      }
      if (e.key !== 'Tab') return;
      const box = boxRef.current;
      if (!box) return;
      const focusables = box.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      const premier = focusables[0];
      const dernier = focusables[focusables.length - 1];
      if (!premier || !dernier) return;
      if (e.shiftKey && document.activeElement === premier) {
        e.preventDefault();
        dernier.focus();
      } else if (!e.shiftKey && document.activeElement === dernier) {
        e.preventDefault();
        premier.focus();
      }
    }

    document.addEventListener('keydown', onKeyDown, true);
    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      document.body.style.overflow = overflowInitial;
      precedent?.focus?.();
    };
  }, [onFermer]);

  return (
    <div
      className={styles.overlay}
      onClick={(e) => {
        if (e.target === e.currentTarget) onFermer();
      }}
    >
      <div
        ref={boxRef}
        className={styles.modale}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titreId}
      >
        <button
          ref={fermerRef}
          type="button"
          className={styles.close}
          onClick={onFermer}
          aria-label="Fermer"
        >
          &#10005;
        </button>

        <div className={styles.modaleScroll}>
          {ev.img && (
            <img
              className={styles.modaleImage}
              src={ev.img}
              alt={ev.title}
              decoding="async"
            />
          )}

          <div className={styles.modaleHead}>
            {ev.icon && (
              <span className={styles.icon} aria-hidden="true">
                {ev.icon}
              </span>
            )}
            {ev.tag && <span className={styles.tag}>{ev.tag}</span>}
          </div>
          <p className={styles.date}>{ev.date}</p>
          <h3 id={titreId} className={styles.modaleTitre}>
            {ev.title}
          </h3>
          <RichText className={styles.modaleDesc} html={ev.desc} />

          {aAnecdotes && (
            <>
              <p className={styles.anecdotesHead}>Anecdotes &amp; curiosites</p>
              <ul className={styles.anecdotes}>
                {ev.anecdotes.map((a, i) => (
                  <li key={i} className={styles.anecdote}>
                    {a.e && (
                      <span className={styles.anecdoteEmoji} aria-hidden="true">
                        {a.e}
                      </span>
                    )}
                    <RichText className={styles.anecdoteText} html={a.t} />
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/*
  Rend le HTML simple (<b>, &nbsp;) present dans le contenu d'origine. Le contenu est
  statique, embarque au build et valide par Zod : aucune entree utilisateur ici.
*/
function RichText({ html, className }: { html: string; className?: string }) {
  return <p className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}
