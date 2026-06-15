import { useEffect, useId, useRef, useState } from 'react';
import type { FicheAtlas } from '../../../core/content/atlas.schema';
import styles from './Atlas.module.css';

/*
  Panneau de fiche pays. Non modal (la carte reste manipulable derriere) mais accessible :
  role complementaire, titre relie en aria-labelledby, fermeture a la croix ou via Echap,
  focus pose sur la croix a l'ouverture. Le contenu est le format structure de l'ancien
  site (6 sections). Une section absente affiche une note discrete plutot qu'un vide.

  Pour un pays sans fiche detaillee (la carte en compte plus que de fiches), on affiche
  au moins sa carte d'identite (drapeau, nom, capitale) : jamais d'ecran vide.
*/

interface Props {
  nomCarte: string; // nom du trace (repli si pas de fiche)
  continentCarte: string;
  fiche: FicheAtlas | undefined;
  capitale: string | undefined;
  onFermer: () => void;
}

type OngletId = 'histoire' | 'politique' | 'economie' | 'societe' | 'environnement' | 'importance';

const ONGLETS: { id: OngletId; label: string; emoji: string }[] = [
  { id: 'histoire', label: 'Histoire', emoji: '📜' },
  { id: 'politique', label: 'Politique', emoji: '🏛' },
  { id: 'economie', label: 'Économie', emoji: '💰' },
  { id: 'societe', label: 'Société', emoji: '👥' },
  { id: 'environnement', label: 'Environnement', emoji: '🌱' },
  { id: 'importance', label: 'Importance', emoji: '⭐' },
];

export function Fiche({ nomCarte, continentCarte, fiche, capitale, onFermer }: Props) {
  const [onglet, setOnglet] = useState<OngletId>('histoire');
  const titreId = useId();
  const fermerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    fermerRef.current?.focus();
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        onFermer();
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onFermer]);

  const nom = fiche?.name ?? nomCarte;
  const cap = fiche?.capitale ?? capitale;
  const continent = fiche?.continent ?? continentCarte;

  return (
    <aside className={styles.panel} role="complementary" aria-labelledby={titreId}>
      <button
        ref={fermerRef}
        type="button"
        className={styles.panelClose}
        onClick={onFermer}
        aria-label="Fermer la fiche"
      >
        &#10005;
      </button>

      <div className={styles.panelScroll}>
        <header className={styles.panelHead}>
          {fiche?.flag && (
            <span className={styles.panelFlag} aria-hidden="true">
              {fiche.flag}
            </span>
          )}
          <h2 id={titreId} className={styles.panelNom}>
            {nom}
          </h2>
          <p className={styles.panelMeta}>
            {cap && <span>{cap}</span>}
            {continent && <span>{continent}</span>}
          </p>
        </header>

        {/* Carte d'identite : repere rapide toujours visible. */}
        {fiche && (
          <div className={styles.panelStats}>
            <Stat label="Population" valeur={fiche.population} />
            <Stat label="Superficie" valeur={fiche.superficie} />
            <Stat label="Monnaie" valeur={fiche.monnaie} />
            <Stat label="Langues" valeur={fiche.langues?.join(', ')} />
          </div>
        )}

        {fiche ? (
          <>
            <nav className={styles.panelTabs} aria-label="Sections de la fiche">
              {ONGLETS.map((o) => {
                const actif = o.id === onglet;
                return (
                  <button
                    key={o.id}
                    type="button"
                    className={`${styles.panelTab} ${actif ? styles.panelTabActif : ''}`}
                    aria-current={actif ? 'true' : undefined}
                    onClick={() => setOnglet(o.id)}
                  >
                    <span aria-hidden="true">{o.emoji}</span> {o.label}
                  </button>
                );
              })}
            </nav>
            <div className={styles.panelSection}>
              <SectionFiche onglet={onglet} fiche={fiche} />
            </div>
          </>
        ) : (
          <p className={styles.panelVide}>
            La fiche detaillee de ce territoire n'est pas encore disponible.
          </p>
        )}
      </div>
    </aside>
  );
}

function Stat({ label, valeur }: { label: string; valeur: string | undefined }) {
  if (!valeur) return null;
  return (
    <div className={styles.stat}>
      <span className={styles.statLabel}>{label}</span>
      <span className={styles.statValeur}>{valeur}</span>
    </div>
  );
}

// Un champ texte libelle (omis si vide).
function Champ({ label, valeur }: { label: string; valeur: string | undefined }) {
  if (!valeur) return null;
  return (
    <div className={styles.champ}>
      <span className={styles.champLabel}>{label}</span>
      <p className={styles.champTexte}>{valeur}</p>
    </div>
  );
}

// Une liste a puces libellee (omise si vide).
function Liste({ label, items }: { label: string; items: string[] | undefined }) {
  if (!items || items.length === 0) return null;
  return (
    <div className={styles.champ}>
      <span className={styles.champLabel}>{label}</span>
      <ul className={styles.champListe}>
        {items.map((it, i) => (
          <li key={i}>{it}</li>
        ))}
      </ul>
    </div>
  );
}

function SectionFiche({ onglet, fiche }: { onglet: OngletId; fiche: FicheAtlas }) {
  switch (onglet) {
    case 'histoire':
      return (
        <>
          <Champ label="Independance" valeur={fiche.histoire?.independance} />
          <Liste label="Evenements majeurs" items={fiche.histoire?.evenements_majeurs} />
          <Champ label="Role historique" valeur={fiche.histoire?.role_historique} />
        </>
      );
    case 'politique':
      return (
        <>
          <Champ label="Regime" valeur={fiche.politique?.regime} />
          <Champ label="Chef d'Etat" valeur={fiche.politique?.chef_etat} />
          <Champ label="Stabilite" valeur={fiche.politique?.stabilite} />
          <Liste label="Alliances" items={fiche.politique?.alliances} />
        </>
      );
    case 'economie':
      return (
        <>
          <Champ label="PIB" valeur={fiche.economie?.pib} />
          <Champ label="PIB par habitant" valeur={fiche.economie?.pib_hab} />
          <Liste label="Ressources" items={fiche.economie?.ressources} />
          <Liste label="Secteurs cles" items={fiche.economie?.secteurs} />
          <Liste label="Grandes villes" items={fiche.economie?.grandes_villes} />
          <Liste label="Places economiques" items={fiche.economie?.places_economiques} />
          <Liste label="Voies de communication" items={fiche.economie?.voies_communication} />
        </>
      );
    case 'societe':
      return (
        <>
          <Champ label="Demographie" valeur={fiche.societe?.demographie} />
          <Champ label="IDH" valeur={fiche.societe?.idh} />
          <Champ label="Education" valeur={fiche.societe?.education} />
          <Champ label="Sante" valeur={fiche.societe?.sante} />
          <Champ label="Inegalites" valeur={fiche.societe?.inegalites} />
          <Champ label="Urbanisation" valeur={fiche.societe?.urbanisation} />
        </>
      );
    case 'environnement':
      return (
        <>
          <Champ label="Pollution" valeur={fiche.environnement?.pollution} />
          <Champ label="Developpement durable" valeur={fiche.environnement?.dev_durable} />
          <Champ label="Recherche" valeur={fiche.environnement?.recherche} />
          <Champ label="Militaire" valeur={fiche.environnement?.militaire} />
          <Liste label="Defis" items={fiche.environnement?.defis} />
        </>
      );
    case 'importance':
      return (
        <>
          <Champ label="Historique" valeur={fiche.importance?.historique} />
          <Champ label="Economique" valeur={fiche.importance?.economique} />
          <Champ label="Geopolitique" valeur={fiche.importance?.geopolitique} />
          <Liste label="Atouts" items={fiche.importance?.atouts} />
          <Liste label="Fragilites" items={fiche.importance?.fragilites} />
        </>
      );
  }
}
