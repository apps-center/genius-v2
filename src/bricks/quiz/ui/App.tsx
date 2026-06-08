import { useEffect, useMemo, useState } from 'react';
import type { AppContext } from '../../../core/context';
import { AppProvider } from '../../../core/context';
import { ContentError } from '../../../core/content/load';
import type { QcmPack, QcmItem } from '../../../core/content/qcm.schema';
import { init, repondre, fini, itemCourant, type QuizState } from '../logic/engine';
import { manifest } from '../manifest';
import styles from './Quiz.module.css';

/*
  ui/ : rendu uniquement. Toute la regle metier vient de logic/engine.
  La brique lit son sujet dans l'URL : elle fonctionne identiquement seule ou dans le shell.
*/

function sujetDepuisUrl(): string {
  const params = new URLSearchParams(window.location.search);
  return params.get('sujet') ?? '';
}

export function App({ ctx }: { ctx: AppContext }) {
  return (
    <AppProvider ctx={ctx}>
      <Quiz ctx={ctx} />
    </AppProvider>
  );
}

type Chargement =
  | { statut: 'chargement' }
  | { statut: 'erreur'; message: string }
  | { statut: 'pret'; pack: QcmPack };

function Quiz({ ctx }: { ctx: AppContext }) {
  const sujet = useMemo(sujetDepuisUrl, []);
  const [chargement, setChargement] = useState<Chargement>({ statut: 'chargement' });

  useEffect(() => {
    let actif = true;
    ctx.content
      .loadPack(sujet, 'qcm')
      .then((pack) => actif && setChargement({ statut: 'pret', pack }))
      .catch((err: unknown) => {
        if (!actif) return;
        // Pack malforme : message clair, jamais d'ecran blanc.
        const message =
          err instanceof ContentError
            ? err.message
            : `Contenu introuvable pour le sujet "${sujet}".`;
        setChargement({ statut: 'erreur', message });
      });
    return () => {
      actif = false;
    };
  }, [ctx, sujet]);

  if (chargement.statut === 'chargement') {
    return <p className={styles.state}>Chargement du pack...</p>;
  }
  if (chargement.statut === 'erreur') {
    return (
      <div className={`${styles.state} ${styles.error}`} role="alert">
        <p className={styles.errorTitle}>Pack non charge</p>
        <p className={styles.errorMsg}>{chargement.message}</p>
      </div>
    );
  }
  return <Partie ctx={ctx} pack={chargement.pack} />;
}

function Partie({ ctx, pack }: { ctx: AppContext; pack: QcmPack }) {
  const items = pack.items;
  const [state, setState] = useState<QuizState>(() => init(items));
  const [choix, setChoix] = useState<number | null>(null);

  // Evenement de domaine : debut d'activite (consomme par gamification/telemetrie).
  useEffect(() => {
    ctx.events.emit('activity.start', { brick: manifest.id, sujet: pack.sujet });
    // Une seule emission au montage de la partie.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (fini(state)) {
    return <Resultat ctx={ctx} pack={pack} state={state} onRejouer={() => relancer()} />;
  }

  const idx = itemCourant(state);
  const item = items[idx] as QcmItem;
  const repondu = choix !== null;

  function valider(c: number) {
    if (repondu) return;
    setChoix(c);
    const { correct } = repondre(state, items, c);
    const itemKey = `${pack.sujet}:${item.id}`;
    ctx.progress.recordAnswer(itemKey, correct);
    ctx.events.emit(correct ? 'answer.correct' : 'answer.wrong', {
      brick: manifest.id,
      sujet: pack.sujet,
      itemId: item.id,
    });
  }

  function suivant() {
    const { state: next } = repondre(state, items, choix ?? -1);
    setChoix(null);
    setState(next);
    if (fini(next)) {
      ctx.events.emit('activity.complete', {
        brick: manifest.id,
        sujet: pack.sujet,
        score: next.score,
        total: next.total,
      });
    }
  }

  function relancer() {
    setState(init(items));
    setChoix(null);
  }

  const numero = state.courant + 1;
  const pct = Math.round((state.courant / state.total) * 100);

  return (
    <div className={styles.wrap}>
      <p className={styles.kicker}>{pack.sujet}</p>
      <h1 className={styles.titre}>{pack.titre}</h1>

      <div className={styles.progress}>
        <span>
          Question {numero} / {state.total}
        </span>
        <span>Score {state.score}</span>
      </div>
      <div className={styles.bar} aria-hidden="true">
        <div className={styles.barFill} style={{ inlineSize: `${pct}%` }} />
      </div>

      <div className={styles.card}>
        <p className={styles.question}>{item.question}</p>

        <div className={styles.choices} role="group" aria-label="Choix de reponse">
          {item.choix.map((texte, i) => {
            const estBon = i === item.bonneReponse;
            const estChoisi = i === choix;
            let cls = styles.choice;
            if (repondu && estBon) cls += ` ${styles.choiceCorrect}`;
            else if (repondu && estChoisi) cls += ` ${styles.choiceWrong}`;
            return (
              <button
                key={i}
                type="button"
                className={cls}
                disabled={repondu}
                aria-pressed={estChoisi}
                onClick={() => valider(i)}
              >
                <span className={styles.puce} aria-hidden="true">
                  {String.fromCharCode(65 + i)}
                </span>
                <span>{texte}</span>
              </button>
            );
          })}
        </div>

        {repondu && (
          <>
            <p
              className={`${styles.feedback} ${
                choix === item.bonneReponse ? styles.feedbackOk : styles.feedbackKo
              }`}
            >
              {choix === item.bonneReponse ? 'Bonne reponse' : 'Mauvaise reponse'}
            </p>
            {item.explication && <p className={styles.explication}>{item.explication}</p>}
            <div className={styles.actions}>
              <button type="button" className={styles.button} onClick={suivant}>
                Suivant
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Resultat({
  pack,
  state,
  onRejouer,
}: {
  ctx: AppContext;
  pack: QcmPack;
  state: QuizState;
  onRejouer: () => void;
}) {
  return (
    <div className={styles.wrap}>
      <p className={styles.kicker}>{pack.titre}</p>
      <div className={`${styles.card} ${styles.resultat}`}>
        <div className={styles.scoreBig}>
          {state.score} / {state.total}
        </div>
        <p className={styles.scoreLabel}>Partie terminee</p>
        <div className={styles.actions}>
          <button type="button" className={styles.button} onClick={onRejouer}>
            Rejouer
          </button>
        </div>
      </div>
    </div>
  );
}
