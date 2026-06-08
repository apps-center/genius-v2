import { Link, useParams } from 'react-router-dom';
import {
  entreeParId,
  modeParId,
  libelleSection,
  type NavEntry,
  type ModeEntree,
} from './entries';
import { packsPour, briqueParId } from './registry';
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

  const aModes = !!entree.modes && entree.modes.length > 0;
  return (
    <div className={styles.screen}>
      <EnTete kicker={libelleSection(entree.section)} titre={entree.titre} sous={entree.sousTitre} />
      {aModes ? <Modes entree={entree} /> : <Placeholder />}
    </div>
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
