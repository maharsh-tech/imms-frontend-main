import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

/**
 * PrivateRoute — redirects unauthenticated users to /login.
 * This is a UX convenience, NOT a security boundary.
 * The backend independently validates every request.
 */
export function PrivateRoute() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
