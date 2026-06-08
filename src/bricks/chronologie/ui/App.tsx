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
  const [chargement, setChargement] = useState<Chargement>({ statut: 'chargement' });

  useEffect(() => {
    let actif = true;
    ctx.content
      .loadPack(cible.sujet, 'chronologie', cible.titre)
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
  }, [ctx, cible]);

  if (chargement.statut === 'chargement') {
    return <p className={styles.state}>Chargement de la frise...</p>;
  }
  if (chargement.statut === 'erreur') {
    return (
      <div className={`${styles.state} ${styles.error}`} role="alert">
        <p className={styles.errorTitle}>Pack non charge</p>
        <p className={styles.errorMsg}>{chargement.message}</p>
      </div>
    );
  }
  return <Frise ctx={ctx} pack={chargement.pack} />;
}

function Frise({ ctx, pack }: { ctx: AppContext; pack: ChronologiePack }) {
  const sections = useMemo(() => construireFrise(pack.periodes), [pack]);
  const nbEvenements = useMemo(() => compterEvenements(pack.periodes), [pack]);
  const nbPeriodes = useMemo(() => compterPeriodes(pack.periodes), [pack]);

  // Evenement de domaine : debut de consultation (consomme par gamification/telemetrie).
  useEffect(() => {
    ctx.events.emit('activity.start', { brick: manifest.id, sujet: pack.sujet });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={styles.wrap}>
      <header className={styles.head}>
        <p className={styles.kicker}>Chronologie historique</p>
        <h1 className={styles.titre}>{pack.titre}</h1>
        <p className={styles.sous}>
          {nbEvenements} evenements - {nbPeriodes} periodes
        </p>
      </header>

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
                  <Evenement key={ev.cle} ctx={ctx} sujet={pack.sujet} ev={ev} />
                ))}
              </div>
            </section>
          ),
        )}
      </div>
    </div>
  );
}

function Evenement({
  ctx,
  sujet,
  ev,
}: {
  ctx: AppContext;
  sujet: string;
  ev: EvenementFrise;
}) {
  const [ouvert, setOuvert] = useState(false);
  const dejaEmis = useRef(false);
  const aAnecdotes = ev.anecdotes.length > 0;
  const panneauId = `anecdotes-${ev.numero}`;

  function basculer() {
    setOuvert((o) => {
      const next = !o;
      // Evenement de domaine emis une seule fois, a la premiere consultation.
      if (next && !dejaEmis.current) {
        dejaEmis.current = true;
        ctx.events.emit('timeline.viewed', {
          brick: manifest.id,
          sujet,
          eventId: `${ev.numero}`,
        });
      }
      return next;
    });
  }

  return (
    <article className={`${styles.card} ${ev.cote === 'gauche' ? styles.gauche : styles.droite}`}>
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

        {aAnecdotes && (
          <>
            <button
              type="button"
              className={styles.toggle}
              aria-expanded={ouvert}
              aria-controls={panneauId}
              onClick={basculer}
            >
              {ouvert ? 'Masquer les anecdotes' : `Anecdotes & curiosites (${ev.anecdotes.length})`}
            </button>
            {ouvert && (
              <ul className={styles.anecdotes} id={panneauId}>
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
            )}
          </>
        )}
      </div>
    </article>
  );
}

/*
  Rend le HTML simple (<b>, &nbsp;) present dans le contenu d'origine. Le contenu est
  statique, embarque au build et valide par Zod : aucune entree utilisateur ici.
*/
function RichText({ html, className }: { html: string; className?: string }) {
  return <p className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}
