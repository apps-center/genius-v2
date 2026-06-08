import { Link, Outlet, useLocation } from 'react-router-dom';
import { CONTENT, briquesPour } from './registry';
import styles from './shell.module.css';

/*
  Shell - layout + navigation GENEREE depuis le registre (rien code en dur).
  Le Hub liste les packs de CONTENT et, pour chacun, les briques capables de le jouer.
*/

export function Shell() {
  const { pathname } = useLocation();
  const surAccueil = pathname === '/';

  return (
    <div className={styles.shell}>
      <div className={styles.topbar}>
        {!surAccueil && (
          <Link to="/" className={styles.back}>
            <span aria-hidden="true">&larr;</span> Accueil
          </Link>
        )}
      </div>
      <main className={styles.main}>
        <Outlet />
      </main>
      <footer className={styles.footer}>L'Encyclopedie des Explorateurs</footer>
    </div>
  );
}

export function Hub() {
  return (
    <>
      <header className={styles.hero}>
        <p className={styles.heroKicker}>Portail des savoirs</p>
        <h1 className={styles.heroTitle}>L'Encyclopedie des Explorateurs</h1>
        <p className={styles.heroSub}>Voyage a travers l'histoire, la geographie et les sciences</p>
        <div className={styles.rule} />
      </header>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Entrainement</h2>
        {CONTENT.length === 0 ? (
          <p className={styles.empty}>Aucun pack de contenu declare pour le moment.</p>
        ) : (
          <div className={styles.grid}>
            {CONTENT.map((pack) => {
              const briques = briquesPour(pack.contentKind);
              return (
                <article key={`${pack.sujet}:${pack.titre}`} className={styles.card}>
                  <div className={styles.cardHead}>
                    <span className={styles.cardKicker}>{pack.sujet}</span>
                    <span className={styles.badge}>Disponible</span>
                  </div>
                  <h3 className={styles.cardTitle}>{pack.titre}</h3>
                  <p className={styles.cardDesc}>
                    {briques.length > 0
                      ? briques[0]!.manifest.description
                      : 'Aucune activite ne sait encore jouer ce contenu.'}
                  </p>
                  <div className={styles.cardActions}>
                    {briques.map((b) => (
                      <Link
                        key={b.manifest.id}
                        to={`/play/${b.manifest.id}?sujet=${encodeURIComponent(
                          pack.sujet,
                        )}&titre=${encodeURIComponent(pack.titre)}`}
                        className={styles.play}
                      >
                        {b.manifest.name}
                      </Link>
                    ))}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}
