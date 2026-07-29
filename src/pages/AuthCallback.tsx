import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import apiClient from '../api/client';
import type { User } from '../types';

const AuthCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const accessToken = searchParams.get('accessToken');
    const refreshToken = searchParams.get('refreshToken');

    if (!accessToken || !refreshToken) {
      setError('Missing authentication tokens. Please try logging in again.');
      return;
    }

    const fetchProfile = async () => {
      try {
        // Temporarily set the access token in headers for this request manually, 
        // because the interceptor pulls from Zustand, which isn't populated yet.
        const response = await apiClient.get<{ user: User; studentState: string | null }>('/auth/me', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        // Save to Zustand store
        setAuth(response.data.user, accessToken, refreshToken);
        
        // TODO: Save studentState in a separate store if needed for student dashboard.
        
        // Redirect to dashboard based on role
        switch (response.data.user.role) {
          case 'COORDINATOR':
            navigate('/coordinator', { replace: true });
            break;
          case 'TEACHER':
            navigate('/teacher', { replace: true });
            break;
          case 'STUDENT':
            navigate('/student', { replace: true });
            break;
          default:
            navigate('/', { replace: true });
        }
      } catch (err: any) {
        console.error('Failed to fetch profile', err);
        setError('Failed to fetch user profile. Your session might be invalid.');
      }
    };

    fetchProfile();
  }, [searchParams, navigate, setAuth]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow text-center">
          <div className="text-red-500 mb-4 font-bold">Authentication Error</div>
          <p className="text-gray-700 mb-6">{error}</p>
          <button
            onClick={() => navigate('/login')}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-700">Completing login...</h2>
      </div>
    </div>
  );
};

export default AuthCallback;
