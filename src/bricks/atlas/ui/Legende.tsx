import type { AtlasPack, EntreeCouche } from '../../../core/content/atlas.schema';
import styles from './Atlas.module.css';

/*
  Legende contextuelle de la couche active. Sa forme depend du type de couche :
   - colors  : pastilles couleur + libelle (+ source) issus du pack ;
   - climat  : une pastille par zone climatique ;
   - ressources : icone emoji + libelle des types du groupe ;
   - maritime : lignes des routes + niveaux des detroits.
  La couche de base 'Monde' n'a pas de legende (rien n'est affiche).
*/

interface Props {
  pack: AtlasPack;
  couche: EntreeCouche;
}

export function Legende({ pack, couche }: Props) {
  const items = construireItems(pack, couche);
  if (!items) return null;

  return (
    <div className={styles.legende} aria-label={`Legende : ${items.titre}`}>
      <span className={styles.legendeTitre}>{items.titre}</span>
      <ul className={styles.legendeListe}>
        {items.entrees.map((e, i) => (
          <li key={i} className={styles.legendeItem}>
            {e.ligne ? (
              <span className={styles.legendeLigne} style={{ background: e.couleur }} aria-hidden="true" />
            ) : e.emoji ? (
              <span className={styles.legendeEmoji} aria-hidden="true">
                {e.emoji}
              </span>
            ) : (
              <span className={styles.legendePastille} style={{ background: e.couleur }} aria-hidden="true" />
            )}
            {e.label}
          </li>
        ))}
      </ul>
      {items.source && <span className={styles.legendeSource}>{items.source}</span>}
    </div>
  );
}

interface ItemLegende {
  label: string;
  couleur?: string;
  emoji?: string;
  ligne?: boolean;
}
interface ContenuLegende {
  titre: string;
  entrees: ItemLegende[];
  source?: string;
}

function construireItems(pack: AtlasPack, couche: EntreeCouche): ContenuLegende | null {
  const { couches } = pack;
  switch (couche.type) {
    case 'colors': {
      const c = couches.colors[couche.id];
      if (!c || c.legende.length === 0) return null;
      return {
        titre: c.legendeTitre ?? c.label,
        entrees: c.legende.map((l) => ({ label: l.label, couleur: l.couleur })),
        source: c.source,
      };
    }
    case 'climat': {
      if (!couches.climat) return null;
      return {
        titre: couches.climat.label,
        entrees: Object.values(couches.climat.zones).map((z) => ({
          label: z.label,
          couleur: z.color,
          emoji: z.icon,
        })),
      };
    }
    case 'ressources': {
      const res = couches.ressources;
      const groupe = res?.groupes[couche.id];
      if (!res || !groupe) return null;
      return {
        titre: groupe.label,
        entrees: groupe.types
          .map((t) => res.meta[t])
          .filter((m): m is NonNullable<typeof m> => !!m)
          .map((m) => ({ label: m.label, emoji: m.icon })),
      };
    }
    case 'maritime': {
      const m = couches.maritime;
      if (!m) return null;
      const routes: ItemLegende[] = m.routes.map((r) => ({ label: r.name, couleur: r.color, ligne: true }));
      const niveaux: ItemLegende[] = [
        { label: 'Point critique', couleur: m.niveauCouleurs.critical },
        { label: 'Tres strategique', couleur: m.niveauCouleurs.high },
        { label: 'Important', couleur: m.niveauCouleurs.medium },
      ].filter((n) => !!n.couleur);
      return { titre: m.label, entrees: [...routes, ...niveaux] };
    }
    default:
      return null;
  }
}
