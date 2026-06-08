import { createRoot, type Root } from 'react-dom/client';
import type { AppContext } from '../../core/context';
import { App } from './ui/App';

/*
  POINT D'ENTREE de la brique. Frontiere stricte (contrat 5.2) :
  on expose EXACTEMENT manifest, mount(container, ctx), unmount(). Rien d'autre.
*/
export { manifest } from './manifest';

let root: Root | null = null;

export function mount(container: HTMLElement, ctx: AppContext): void {
  root = createRoot(container);
  root.render(<App ctx={ctx} />);
}

export function unmount(): void {
  // Declenche les cleanup useEffect : timers/listeners/abonnements liberes.
  root?.unmount();
  root = null;
}
