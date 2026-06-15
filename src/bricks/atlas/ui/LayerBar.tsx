import type { AtlasPack, EntreeCouche } from '../../../core/content/atlas.schema';
import styles from './Atlas.module.css';

/*
  Barre de selection des couches, generee depuis pack.navConfig (categories + couches).
  Aucune couche codee en dur : enrichir navConfig dans le pack ajoute des boutons, zero
  code ici. Chaque bouton est une vraie cible tactile (>= 44px) au focus visible.
*/

interface Props {
  pack: AtlasPack;
  coucheActiveId: string;
  onSelect: (couche: EntreeCouche) => void;
}

export function LayerBar({ pack, coucheActiveId, onSelect }: Props) {
  return (
    <div className={styles.layerBar} role="group" aria-label="Couches de la carte">
      {pack.navConfig.map((cat) => (
        <div key={cat.id} className={styles.layerCat}>
          <span className={styles.layerCatLabel}>
            {cat.emoji && <span aria-hidden="true">{cat.emoji}</span>} {cat.label}
          </span>
          <div className={styles.layerBtns}>
            {cat.layers.map((couche) => {
              const actif = couche.id === coucheActiveId;
              return (
                <button
                  key={couche.id}
                  type="button"
                  className={`${styles.layerBtn} ${actif ? styles.layerBtnActif : ''}`}
                  aria-pressed={actif}
                  onClick={() => onSelect(couche)}
                >
                  {couche.emoji && <span aria-hidden="true">{couche.emoji}</span>} {couche.label}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
