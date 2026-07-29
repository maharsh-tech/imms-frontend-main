import { useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import apiClient from '../api/client';

/** Restore session from httpOnly cookies on page load. */
const AuthBootstrap = ({ children }: { children: React.ReactNode }) => {
  const { setUser, setBootstrapped, isBootstrapped } = useAuthStore();

  useEffect(() => {
    const bootstrap = async () => {
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
  }, [setUser, setBootstrapped]);

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
