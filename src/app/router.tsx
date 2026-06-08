import { createBrowserRouter } from 'react-router-dom';
import { Shell, Hub } from './shell';
import { Activite, ModeScreen } from './activite';
import { BrickHost } from './BrickHost';

/*
  Routes GENEREES depuis le registre (rien code en dur). Trois patrons couvrent les
  trois niveaux de nav, quel que soit le nombre d'entrees declarees :
   - /                          accueil (niveau 1)
   - /activite/:entryId         ecran d'entree d'une activite/module (niveau 2)
   - /activite/:entryId/:modeId choix du theme d'un mode jouable (niveau 3)
   - /play/:brickId             montage d'une brique (le quiz QCM existant, inchange)
*/
export const router = createBrowserRouter([
  {
    path: '/',
    element: <Shell />,
    children: [
      { index: true, element: <Hub /> },
      { path: 'activite/:entryId', element: <Activite /> },
      { path: 'activite/:entryId/:modeId', element: <ModeScreen /> },
      { path: 'play/:brickId', element: <BrickHost /> },
    ],
  },
]);
