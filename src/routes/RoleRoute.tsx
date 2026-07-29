import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import type { Role } from '../types';

interface RoleRouteProps {
  allowedRoles: Role[];
}

const RoleRoute: React.FC<RoleRouteProps> = ({ allowedRoles }) => {
  const { user } = useAuthStore();

  if (!user || !allowedRoles.includes(user.role)) {
    // If not authorized, redirect to their role's home or default home
    if (user?.role === 'COORDINATOR') return <Navigate to="/coordinator" replace />;
    if (user?.role === 'TEACHER') return <Navigate to="/teacher" replace />;
    if (user?.role === 'STUDENT') return <Navigate to="/student" replace />;
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default RoleRoute;
