import { createBrowserRouter } from 'react-router';
import Layout from '../widgets/layout/ui/Layout';
import AdminLayout from '../widgets/admin-layout/ui/AdminLayout';
import { DynamicIndexRedirect, buildRoutes } from '../shared/router';
import VmOrderPage from '../pages/vm-order';
import NotFoundPage from '../pages/not-found';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <VmOrderPage /> },
      {
        path: 'administration',
        element: <AdminLayout />,
        children: [
          { index: true, element: <DynamicIndexRedirect /> },
          ...buildRoutes(),
        ],
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
]);
