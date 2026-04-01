import { createBrowserRouter } from 'react-router';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AppProvider } from './context/AppContext';
import { Home } from './pages/Home';
import { Favorites } from './pages/Favorites';
import { ServiceDetail } from './pages/ServiceDetail';
import { Profile } from './pages/Profile';
import { ManageServices } from './pages/ManageServices';
import { UserManagement } from './pages/UserManagement';
import { Orders } from './pages/Orders';
import { MyOrders } from './pages/MyOrders';
import { MasterStats } from './pages/MasterStats';
import { AdminStats } from './pages/AdminStats';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { NotFound } from './pages/NotFound';
import { Outlet } from 'react-router';

// Root component with AppProvider
const Root = () => (
  <AppProvider>
    <Outlet />
  </AppProvider>
);

export const router = createBrowserRouter([
  {
    element: <Root />,
    children: [
      {
        path: '/login',
        Component: Login,
      },
      {
        path: '/register',
        Component: Register,
      },
      {
        path: '/',
        element: (
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        ),
        children: [
          { index: true, Component: Home },
          { path: 'favorites', Component: Favorites },
          { path: 'service/:id', Component: ServiceDetail },
          { path: 'profile', Component: Profile },
          {
            path: 'manage-services',
            element: (
              <ProtectedRoute allowedRoles={['admin']}>
                <ManageServices />
              </ProtectedRoute>
            ),
          },
          {
            path: 'user-management',
            element: (
              <ProtectedRoute allowedRoles={['admin']}>
                <UserManagement />
              </ProtectedRoute>
            ),
          },
          {
            path: 'orders',
            element: (
              <ProtectedRoute allowedRoles={['master']}>
                <Orders />
              </ProtectedRoute>
            ),
          },
          {
            path: 'my-orders',
            element: (
              <ProtectedRoute allowedRoles={['user']}>
                <MyOrders />
              </ProtectedRoute>
            ),
          },
          {
            path: 'master-stats',
            element: (
              <ProtectedRoute allowedRoles={['master']}>
                <MasterStats />
              </ProtectedRoute>
            ),
          },
          {
            path: 'admin-stats',
            element: (
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminStats />
              </ProtectedRoute>
            ),
          },
        ],
      },
      {
        path: '*',
        Component: NotFound,
      },
    ],
  },
]);
