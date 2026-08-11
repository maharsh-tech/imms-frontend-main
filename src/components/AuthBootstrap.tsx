import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import apiClient from '../api/client';
import { isPublicAuthPath } from '../api/session-expired';

/** Restore session from httpOnly cookies on page load. */
const AuthBootstrap = ({ children }: { children: React.ReactNode }) => {
  const { setUser, setBootstrapped, isBootstrapped } = useAuthStore();
  const { pathname } = useLocation();

  useEffect(() => {
    const bootstrap = async () => {
      if (isPublicAuthPath(pathname)) {
        setBootstrapped(true);
        return;
      }

      try {
        const { data } = await apiClient.get('/auth/me');
        setUser(data.user);
      } catch {
        useAuthStore.getState().logout();
      } finally {
        setBootstrapped(true);
      }
    };
    bootstrap();
  }, [pathname, setUser, setBootstrapped]);

  if (!isBootstrapped) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-gray-500 animate-pulse">Loading...</p>
      </div>
    );
  }

  return children;
};

export default AuthBootstrap;
