import { createBrowserRouter } from 'react-router-dom';
import { Shell, Hub } from './shell';
import { BrickHost } from './BrickHost';

/*
  Routes GENEREES depuis le registre (rien code en dur).
  Une seule route parametree /play/:brickId monte n'importe quelle brique declaree :
  ajouter une activite n'ajoute aucune route ici.
*/
export const router = createBrowserRouter([
  {
    path: '/',
    element: <Shell />,
    children: [
      { index: true, element: <Hub /> },
      { path: 'play/:brickId', element: <BrickHost /> },
    ],
  },
]);
