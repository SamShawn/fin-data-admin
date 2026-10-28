import { lazy } from 'react';
import { createBrowserRouter } from 'react-router-dom';

import { AppLayout } from './layouts/AppLayout';
import LoginPage from './pages/Login';

const HomePage = lazy(() => import('./pages/Home'));
const NotFound = lazy(() => import('./pages/404'));
const AuditLogPage = lazy(() => import('./pages/AuditLog'));

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: '*', element: <NotFound /> },
      { path: '/audit-logs', element: <AuditLogPage /> },
    ],
  },
]);
