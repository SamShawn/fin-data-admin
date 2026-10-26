import { lazy } from 'react';
import { createBrowserRouter } from 'react-router-dom';

import { AppLayout } from './layouts/AppLayout';

const HomePage = lazy(() => import('./pages/Home'));
const NotFound = lazy(() => import('./pages/404'));

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: '*', element: <NotFound /> },
    ],
  },
]);
