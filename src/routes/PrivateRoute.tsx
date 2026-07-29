import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

const PrivateRoute: React.FC = () => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.needsPasswordChange) {
    return <Navigate to="/change-password" replace />;
  }

  return <Outlet />;
};

export default PrivateRoute;
