import { useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useApp } from '../core/context';
import { briqueParId } from './registry';
import { ErrorBoundary } from './ErrorBoundary';
import styles from './shell.module.css';

/*
  BrickHost - monte une brique via sa frontiere mount/unmount dans un noeud DOM dedie,
  a l'interieur d'un ErrorBoundary (invariant 8). Le demontage est garanti au changement
  de route ou a la sortie : unmount() libere timers/listeners/abonnements.
*/
function Host({ brickId }: { brickId: string }) {
  const ctx = useApp();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const brique = briqueParId(brickId);
    const container = ref.current;
    if (!brique || !container) return;
    brique.mount(container, ctx);
    return () => brique.unmount();
  }, [brickId, ctx]);

  return <div ref={ref} className={styles.brickRoot} />;
}

export function BrickHost() {
  const { brickId = '' } = useParams();
  const brique = briqueParId(brickId);

  if (!brique) {
    return (
      <div className={styles.fallback} role="alert">
        <p className={styles.fallbackTitle}>Activite inconnue</p>
        <p className={styles.fallbackMsg}>Aucune brique ne correspond a "{brickId}".</p>
      </div>
    );
  }

  // key=brickId : remonte proprement (et reinitialise l'ErrorBoundary) a chaque activite.
  return (
    <ErrorBoundary key={brickId} nom={brickId}>
      <Host brickId={brickId} />
    </ErrorBoundary>
  );
}
