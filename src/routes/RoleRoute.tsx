import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import type { Role } from '../types';

interface RoleRouteProps {
  allowedRoles: Role[];
}

/**
 * RoleRoute — restricts routes to specific roles.
 * This is a UX convenience, NOT a security boundary.
 * The backend independently enforces RBAC on every endpoint.
 */
export function RoleRoute({ allowedRoles }: RoleRouteProps) {
  const user = useAuthStore((state) => state.user);

  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
