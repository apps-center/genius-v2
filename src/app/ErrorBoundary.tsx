import { Component, type ErrorInfo, type ReactNode } from 'react';
import styles from './shell.module.css';

/*
  ErrorBoundary - robustesse (invariant 8). Une brique qui plante n'abat pas l'app :
  le shell affiche un fallback propre au lieu d'un ecran blanc.
*/

interface Props {
  children: ReactNode;
  nom?: string;
}
interface State {
  erreur: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { erreur: null };

  static getDerivedStateFromError(erreur: Error): State {
    return { erreur };
  }

  componentDidCatch(erreur: Error, info: ErrorInfo): void {
    console.error('[ErrorBoundary] brique en echec', this.props.nom, erreur, info);
  }

  // Permet au shell de reinitialiser le fallback en changeant de route.
  reset = (): void => this.setState({ erreur: null });

  render(): ReactNode {
    if (this.state.erreur) {
      return (
        <div className={styles.fallback} role="alert">
          <p className={styles.fallbackTitle}>Cette activite a rencontre un probleme</p>
          <p className={styles.fallbackMsg}>{this.state.erreur.message}</p>
          <button type="button" className={styles.fallbackBtn} onClick={this.reset}>
            Reessayer
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
