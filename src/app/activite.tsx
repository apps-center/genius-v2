import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { useApp } from '../core/context';
import type { ContentEntry } from '../core/content/client';
import { ContentError } from '../core/content/load';
import {
  entreeParId,
  modeParId,
  libelleSection,
  type NavEntry,
  type ModeEntree,
} from './entries';
import { packsPour, briqueParId } from './registry';
import {
  apercuDeck,
  libelleModele,
  iconeModele,
  type ApercuDeck,
} from './flashcards-entree';
import styles from './shell.module.css';

/*
  Ecrans de niveau 2 (Activite) et 3 (ModeScreen), GENERES depuis le registre.
  - Niveau 2 : entree d'une activite/module. Modes pour le Quiz, sinon placeholder "a venir".
  - Niveau 3 : choix d'un theme pour un mode jouable -> lance la brique via /play/:brickId.
  Aucune donnee n'est inventee : un module non migre s'arrete a un placeholder propre.
*/

// --- Niveau 2 : ecran d'entree d'une activite/module ---
export function Activite() {
  const { entryId = '' } = useParams();
  const entree = entreeParId(entryId);
  if (!entree) return <Introuvable cible={entryId} />;

  // Entree a lancement direct (module) : on saute l'ecran de niveau 2 et on monte la brique.
  if (entree.lancement) {
    const l = entree.lancement;
    return (
      <Navigate
        replace
        to={`/play/${l.brickId}?sujet=${encodeURIComponent(l.sujet)}&titre=${encodeURIComponent(
          l.titre,
        )}`}
      />
    );
  }

  // Entree "grille de decks" (Flashcards) : niveau 2 = grille decouverte du registre.
  if (entree.grille) {
    return (
      <div className={styles.screen}>
        <EnTete
          kicker={libelleSection(entree.section)}
          titre={entree.titre}
          sous={entree.sousTitre}
        />
        <GrilleDecks entree={entree} />
      </div>
    );
  }

  const aModes = !!entree.modes && entree.modes.length > 0;
  return (
    <div className={styles.screen}>
      <EnTete kicker={libelleSection(entree.section)} titre={entree.titre} sous={entree.sousTitre} />
      {aModes ? <Modes entree={entree} /> : <Placeholder />}
    </div>
  );
}

// --- Niveau 2 (variante) : grille de decks decouverte du registre (Flashcards) ---
// Etat d'apercu d'un deck : le titre/lien viennent du registre (toujours connus,
// donc toujours cliquables) ; le compteur et le modele viennent du pack charge.
type EtatApercu =
  | { statut: 'chargement' }
  | { statut: 'pret'; apercu: ApercuDeck }
  | { statut: 'erreur' };

function GrilleDecks({ entree }: { entree: NavEntry }) {
  const grille = entree.grille!;
  const ctx = useApp();
  // DECOUVERTE depuis le registre : aucun deck code en dur ici. Un futur deck
  // ajoute au registre apparait automatiquement dans cette grille.
  const decks = useMemo(
    () => ctx.content.list(grille.contentKind),
    [ctx, grille.contentKind],
  );
  const [apercus, setApercus] = useState<Record<string, EtatApercu>>({});

  useEffect(() => {
    let actif = true;
    setApercus({});
    for (const deck of decks) {
      const cle = `${deck.sujet}:${deck.titre}`;
      ctx.content
        .loadPack(deck.sujet, 'flashcards', deck.titre)
        .then((pack) => {
          if (actif) setApercus((m) => ({ ...m, [cle]: { statut: 'pret', apercu: apercuDeck(pack) } }));
        })
        .catch((err: unknown) => {
          // Pack rejete par Zod : on n'efface pas la tuile (toujours jouable), on
          // signale juste l'apercu indisponible (jamais d'ecran blanc silencieux).
          if (err instanceof ContentError || err instanceof Error) {
            if (actif) setApercus((m) => ({ ...m, [cle]: { statut: 'erreur' } }));
          }
        });
    }
    return () => {
      actif = false;
    };
  }, [decks, ctx]);

  if (decks.length === 0) {
    return (
      <div className={styles.placeholder}>
        <p className={styles.placeholderBadge}>À venir</p>
        <p className={styles.placeholderMsg}>Aucun deck n'est encore declare au registre.</p>
      </div>
    );
  }

  // Sequence unique (haut -> bas, conservee aussi en grille bureau, ordre de lecture) :
  // Mode Genius (a venir), puis les decks dans l'ordre du registre, puis Statistiques
  // par deck (a venir). Les deux cartes "Bientot" restent clairement desactivees.
  return (
    <div className={styles.grid}>
      {/* Mode Genius : jouable, lance la brique flashcards sur TOUS les decks melanges. */}
      <Link to={`/play/${grille.brickId}?mode=genius`} className={styles.cardLink}>
        <article className={styles.card}>
          <div className={styles.cardHead}>
            <span className={styles.cardIcon} aria-hidden="true">
              ⚡
            </span>
            <span className={styles.badge}>Jouer</span>
          </div>
          <h3 className={styles.cardTitle}>Mode Genius</h3>
          <p className={styles.cardDesc}>
            Tous les decks melanges en un seul defi, tous themes confondus.
          </p>
        </article>
      </Link>
      {decks.map((deck) => (
        <TuileDeck
          key={`${deck.sujet}:${deck.titre}`}
          deck={deck}
          brickId={grille.brickId}
          etat={apercus[`${deck.sujet}:${deck.titre}`] ?? { statut: 'chargement' }}
        />
      ))}
      <ReserveCard
        titre="Statistiques par deck"
        msg="Cartes vues et progression de chaque deck s'afficheront ici."
      />
    </div>
  );
}

// Emplacement reserve : materialise mais clairement desactive (zero fausse donnee),
// place dans la sequence des decks (Mode Genius en tete, Statistiques en fin).
function ReserveCard({ titre, msg }: { titre: string; msg: string }) {
  return (
    <section className={styles.reserve} aria-disabled="true">
      <span className={styles.reserveBadge}>Bientot</span>
      <h3 className={styles.reserveTitle}>{titre}</h3>
      <p className={styles.reserveMsg}>{msg}</p>
    </section>
  );
}

function TuileDeck({
  deck,
  brickId,
  etat,
}: {
  deck: ContentEntry;
  brickId: string;
  etat: EtatApercu;
}) {
  // Lien vers la brique avec les coordonnees du registre : plus jamais d'URL tapee a la main.
  const lien = `/play/${brickId}?sujet=${encodeURIComponent(
    deck.sujet,
  )}&titre=${encodeURIComponent(deck.titre)}`;
  const icone = etat.statut === 'pret' ? iconeModele(etat.apercu.modele) : '🃏';

  return (
    <Link to={lien} className={styles.cardLink}>
      <article className={styles.card}>
        <div className={styles.cardHead}>
          <span className={styles.cardIcon} aria-hidden="true">
            {icone}
          </span>
          <span className={styles.badge}>Jouer</span>
        </div>
        <h3 className={styles.cardTitle}>{deck.titre}</h3>
        <div className={styles.deckMeta}>
          {etat.statut === 'pret' ? (
            <>
              <span className={styles.deckCount}>{etat.apercu.nbCartes} cartes</span>
              <span className={styles.deckType}>{libelleModele(etat.apercu.modele)}</span>
            </>
          ) : etat.statut === 'erreur' ? (
            <span className={styles.deckCount}>Apercu indisponible</span>
          ) : (
            <span className={styles.deckCount}>Chargement...</span>
          )}
        </div>
      </article>
    </Link>
  );
}

function Modes({ entree }: { entree: NavEntry }) {
  const modes = entree.modes ?? [];
  // Compteurs derives du contenu REEL (pas de chiffre aspirationnel).
  const jouable = modes.find((m) => m.etat === 'disponible' && m.contentKind);
  const nbThemes = jouable?.contentKind ? packsPour(jouable.contentKind).length : 0;
  const nbDispo = modes.filter((m) => m.etat === 'disponible').length;

  const stats = [
    { valeur: String(nbThemes), label: 'Themes de questions' },
    { valeur: String(nbDispo), label: nbDispo > 1 ? 'Modes jouables' : 'Mode jouable' },
    { valeur: String(modes.length), label: 'Modes au total' },
  ];

  return (
    <>
      <div className={styles.statsBar}>
        {stats.map((s) => (
          <div key={s.label} className={styles.stat}>
            <span className={styles.statValue}>{s.valeur}</span>
            <span className={styles.statLabel}>{s.label}</span>
          </div>
        ))}
      </div>
      <div className={styles.grid}>
        {modes.map((m) => (
          <ModeCard key={m.id} entree={entree} mode={m} />
        ))}
      </div>
    </>
  );
}

function ModeCard({ entree, mode }: { entree: NavEntry; mode: ModeEntree }) {
  const aVenir = mode.etat === 'a-venir';
  const corps = (
    <article className={styles.card}>
      <div className={styles.cardHead}>
        <span className={styles.cardIcon} aria-hidden="true">
          {mode.icone}
        </span>
        <span className={aVenir ? styles.badgeComing : styles.badge}>
          {aVenir ? 'À venir' : 'Disponible'}
        </span>
      </div>
      <h3 className={styles.cardTitle}>{mode.titre}</h3>
      <p className={styles.cardDesc}>{mode.description}</p>
      <p className={styles.modeBadge}>{mode.badge}</p>
    </article>
  );

  // Mode non jouable : carte attenuee, non cliquable (aucune fausse promesse).
  if (aVenir) {
    return (
      <div className={`${styles.cardLink} ${styles.cardComing}`} aria-disabled="true">
        {corps}
      </div>
    );
  }
  return (
    <Link to={`/activite/${entree.id}/${mode.id}`} className={styles.cardLink}>
      {corps}
    </Link>
  );
}

// --- Niveau 3 : choix du theme pour un mode jouable ---
export function ModeScreen() {
  const { entryId = '', modeId = '' } = useParams();
  const entree = entreeParId(entryId);
  const mode = entree ? modeParId(entree, modeId) : undefined;
  if (!entree || !mode) return <Introuvable cible={`${entryId}/${modeId}`} />;

  // Mode declare mais pas encore jouable : on s'arrete au placeholder.
  if (mode.etat !== 'disponible' || !mode.brickId || !mode.contentKind) {
    return (
      <div className={styles.screen}>
        <EnTete kicker={entree.titre} titre={mode.titre} />
        <Placeholder />
      </div>
    );
  }

  const brique = briqueParId(mode.brickId);
  const packs = packsPour(mode.contentKind);
  if (!brique || packs.length === 0) {
    return (
      <div className={styles.screen}>
        <EnTete kicker={entree.titre} titre={mode.titre} />
        <div className={styles.placeholder}>
          <p className={styles.placeholderBadge}>À venir</p>
          <p className={styles.placeholderMsg}>Aucun theme n'est encore disponible pour ce mode.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.screen}>
      <EnTete
        kicker={entree.titre}
        titre={mode.titre}
        sous="Choisis un theme pour lancer ta partie."
      />
      <div className={styles.grid}>
        {packs.map((pack) => (
          <Link
            key={`${pack.sujet}:${pack.titre}`}
            to={`/play/${brique.manifest.id}?sujet=${encodeURIComponent(
              pack.sujet,
            )}&titre=${encodeURIComponent(pack.titre)}`}
            className={styles.cardLink}
          >
            <article className={styles.card}>
              <div className={styles.cardHead}>
                <span className={styles.cardKicker}>{pack.sujet}</span>
                <span className={styles.badge}>Jouer</span>
              </div>
              <h3 className={styles.cardTitle}>{pack.titre}</h3>
            </article>
          </Link>
        ))}
      </div>
    </div>
  );
}

// --- Briques partagees de presentation ---
function EnTete({ kicker, titre, sous }: { kicker: string; titre: string; sous?: string }) {
  return (
    <header className={styles.screenHead}>
      <p className={styles.heroKicker}>{kicker}</p>
      <h1 className={styles.screenTitle}>{titre}</h1>
      {sous && <p className={styles.heroSub}>{sous}</p>}
    </header>
  );
}

function Placeholder() {
  return (
    <div className={styles.placeholder}>
      <p className={styles.placeholderBadge}>À venir</p>
      <p className={styles.placeholderMsg}>Bientot disponible.</p>
    </div>
  );
}

function Introuvable({ cible }: { cible: string }) {
  return (
    <div className={styles.fallback} role="alert">
      <p className={styles.fallbackTitle}>Entree inconnue</p>
      <p className={styles.fallbackMsg}>Aucune entree ne correspond a "{cible}".</p>
      <Link to="/" className={styles.fallbackBtn}>
        Retour a l'accueil
      </Link>
    </div>
  );
}
