import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { AppProvider } from './core/context';
import { createAppContext } from './core/bootstrap';
import { attachGamification } from './core/gamification/consumer';
import { CONTENT } from './app/registry';
import { router } from './app/router';
import reglesGamification from './content/gamification/regles.json';
import './styles/global.css';

/*
  Bootstrap : monte le shell sur #genius-root.
  On assemble le ctx (events/content/progress) une seule fois et on branche
  les CONSOMMATEURS transverses (ici la gamification) APRES COUP, sans rouvrir une brique.
*/
const ctx = createAppContext(CONTENT);
attachGamification(ctx.events, ctx.progress, reglesGamification);

const container = document.getElementById('genius-root');
if (!container) {
  throw new Error('Point de montage #genius-root introuvable');
}

createRoot(container).render(
  <StrictMode>
    <AppProvider ctx={ctx}>
      <RouterProvider router={router} />
    </AppProvider>
  </StrictMode>,
);
