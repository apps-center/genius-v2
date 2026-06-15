import { Link, Outlet, useLocation } from 'react-router-dom';
import {
  ENTRIES,
  entreesParSection,
  libelleSection,
  type NavEntry,
  type SectionAccueil,
} from './entries';
import styles from './shell.module.css';

/*
  Shell - layout + navigation GENEREE depuis le registre (rien code en dur).
  Le Hub liste les ENTREES de nav (activites + modules), groupees par section.
  En-tete, lien retour et pied de page sont les elements transverses de l'audit.
*/

export function Shell() {
  const { pathname } = useLocation();
  const surAccueil = pathname === '/';

  return (
    <div className={styles.shell}>
      {!surAccueil && (
        <div className={styles.topbar}>
          <Link to="/" className={styles.back}>
            <span aria-hidden="true">&larr;</span> Accueil
          </Link>
        </div>
      )}
      <main className={styles.main}>
        <Outlet />
      </main>
      <footer className={styles.footer}>
        L'Encyclopedie des Explorateurs · Culture generale interactive
      </footer>
    </div>
  );
}

// Ordre des sections d'accueil (chaque section liste ses entrees depuis le registre).
const SECTIONS: readonly SectionAccueil[] = ['entrainement', 'modules'];

export function Hub() {
  return (
    <>
      <header className={styles.hero}>
        <p className={styles.heroKicker}>Portail des savoirs</p>
        <h1 className={styles.heroTitle}>L'Encyclopedie des Explorateurs</h1>
        <p className={styles.heroSub}>Voyage a travers l'histoire, la geographie et les sciences</p>
        <div className={styles.rule} />
      </header>

      {ENTRIES.length === 0 ? (
        <section className={styles.section}>
          <p className={styles.empty}>Aucune entree declaree pour le moment.</p>
        </section>
      ) : (
        SECTIONS.map((section) => (
          <section key={section} className={styles.section}>
            <h2 className={styles.sectionTitle}>{libelleSection(section)}</h2>
            <div className={styles.grid}>
              {entreesParSection(section).map((entree) => (
                <EntryCard key={entree.id} entree={entree} />
              ))}
            </div>
          </section>
        ))
      )}
    </>
  );
}

function EntryCard({ entree }: { entree: NavEntry }) {
  const aVenir = entree.etat === 'a-venir';
  // Un module a lancement direct va droit a la brique ; sinon, ecran d'entree de niveau 2.
  const cible = entree.lancement
    ? `/play/${entree.lancement.brickId}?sujet=${encodeURIComponent(
        entree.lancement.sujet,
      )}&titre=${encodeURIComponent(entree.lancement.titre)}`
    : `/activite/${entree.id}`;
  return (
    <Link
      to={cible}
      className={`${styles.cardLink} ${aVenir ? styles.cardComing : ''}`}
    >
      <article className={styles.card}>
        <div className={styles.cardHead}>
          <span className={styles.cardIcon} aria-hidden="true">
            {entree.icone}
          </span>
          <span className={aVenir ? styles.badgeComing : styles.badge}>
            {aVenir ? 'À venir' : 'Disponible'}
          </span>
        </div>
        <h3 className={styles.cardTitle}>{entree.titre}</h3>
        {entree.sousTitre && <p className={styles.cardKicker}>{entree.sousTitre}</p>}
        <p className={styles.cardDesc}>{entree.description}</p>
        <div className={styles.tags}>
          {entree.tags.map((t) => (
            <span key={t} className={styles.tag}>
              {t}
            </span>
          ))}
        </div>
      </article>
    </Link>
  );
}
