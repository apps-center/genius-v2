import { useEffect, useMemo, useState } from 'react';
import type { AppContext } from '../../../core/context';
import { AppProvider } from '../../../core/context';
import { ContentError } from '../../../core/content/load';
import type { QcmPack, QcmItem } from '../../../core/content/qcm.schema';
import {
  init,
  repondre,
  fini,
  itemCourant,
  melangeChoix,
  graineChoix,
  type QuizState,
} from '../logic/engine';
import { manifest } from '../manifest';
import styles from './Quiz.module.css';

/*
  ui/ : rendu uniquement. Toute la regle metier vient de logic/engine.
  La brique lit son sujet dans l'URL : elle fonctionne identiquement seule ou dans le shell.
*/

interface Cible {
  sujet: string;
  titre: string | undefined;
}

function cibleDepuisUrl(): Cible {
  const params = new URLSearchParams(window.location.search);
  return {
    sujet: params.get('sujet') ?? '',
    // `titre` desambigue les periodes d'une meme matiere (ex. Prehistoire vs Antiquite).
    titre: params.get('titre') ?? undefined,
  };
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
  const cible = useMemo(cibleDepuisUrl, []);
  const [chargement, setChargement] = useState<Chargement>({ statut: 'chargement' });

  useEffect(() => {
    let actif = true;
    ctx.content
      .loadPack(cible.sujet, 'qcm', cible.titre)
      .then((pack) => actif && setChargement({ statut: 'pret', pack }))
      .catch((err: unknown) => {
        if (!actif) return;
        // Pack malforme : message clair, jamais d'ecran blanc.
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

  const idx = itemCourant(state);
  // undefined quand la partie est finie : l'item courant n'existe plus.
  const item = items[idx] as QcmItem | undefined;

  // Ordre d'affichage des choix, melange et reproductible pour cette question.
  // Hook AVANT tout return : l'ordre des hooks doit rester stable d'un rendu a l'autre.
  const affichage = useMemo(
    () =>
      item
        ? melangeChoix(item.choix.length, item.bonneReponse, graineChoix(state))
        : { ordre: [] as number[], bonneReponse: -1 },
    [item, state],
  );

  function relancer() {
    setState(init(items));
    setChoix(null);
  }

  if (fini(state) || !item) {
    return <Resultat ctx={ctx} pack={pack} state={state} onRejouer={relancer} />;
  }

  // item est ici garanti defini ; on le capture pour les closures (le narrowing
  // de TS ne traverse pas les fonctions imbriquees).
  const courant: QcmItem = item;
  // `choix` = position AFFICHEE selectionnee (apres melange), ou null.
  const repondu = choix !== null;
  const estCorrect = repondu ? affichage.ordre[choix] === item.bonneReponse : false;

  function valider(positionAffichee: number) {
    if (repondu) return;
    setChoix(positionAffichee);
    // On repond avec l'index D'ORIGINE du choix (le moteur compare a bonneReponse).
    const indexOrigine = affichage.ordre[positionAffichee] ?? -1;
    const { correct } = repondre(state, items, indexOrigine);
    const itemKey = `${pack.sujet}:${courant.id}`;
    ctx.progress.recordAnswer(itemKey, correct);
    ctx.events.emit(correct ? 'answer.correct' : 'answer.wrong', {
      brick: manifest.id,
      sujet: pack.sujet,
      itemId: courant.id,
    });
  }

  function suivant() {
    const indexOrigine = choix !== null ? (affichage.ordre[choix] ?? -1) : -1;
    const { state: next } = repondre(state, items, indexOrigine);
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

  const numero = state.courant + 1;
  const pct = Math.round((state.courant / state.total) * 100);
  const theme = item.sujet ?? pack.titre;

  return (
    <div className={styles.wrap}>
      <p className={styles.kicker}>{pack.titre}</p>
      <h1 className={styles.titre}>{manifest.name}</h1>

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
        <p className={styles.badge}>{theme}</p>
        <p className={styles.question}>{item.question}</p>

        <div className={styles.choices} role="group" aria-label="Choix de reponse">
          {affichage.ordre.map((indexOrigine, position) => {
            const texte = item.choix[indexOrigine] as string;
            const estBon = indexOrigine === item.bonneReponse;
            const estChoisi = position === choix;
            let cls = styles.choice;
            if (repondu && estBon) cls += ` ${styles.choiceCorrect}`;
            else if (repondu && estChoisi) cls += ` ${styles.choiceWrong}`;
            return (
              <button
                key={indexOrigine}
                type="button"
                className={cls}
                disabled={repondu}
                aria-pressed={estChoisi}
                onClick={() => valider(position)}
              >
                <span className={styles.puce} aria-hidden="true">
                  {String.fromCharCode(65 + position)}
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
                estCorrect ? styles.feedbackOk : styles.feedbackKo
              }`}
            >
              {estCorrect ? 'Bonne reponse' : 'Mauvaise reponse'}
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
